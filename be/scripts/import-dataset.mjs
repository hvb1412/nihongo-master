import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { strFromU8, unzipSync } from 'fflate'
import { db } from '../src/config.mjs'
import { exampleId, searchable } from '../src/services/content-data.mjs'
import { levels } from '../src/utils.mjs'
import { original, openjlpt, unihan, kanjivg, bunchaway, hanVietWordlist } from './sources.mjs'
import { readHanViet, vocabularyHanViet } from './han-viet.mjs'

const cache = new URL('../../.cache/data/', import.meta.url)
const ref = '0d1d3410bec90bd4098a7c72de820543cb4f707c'
const pinned = [
  ['openjlpt.sqlite', 'https://raw.githubusercontent.com/evanclan/OpenJLPT/' + ref + '/data/openjlpt.sqlite', '5263ba7a5000a9013baa646b3b80241161028fc561c092d57dc8b864ae92b271'],
  ['Unihan.zip', 'https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip', 'f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e'],
  ['kanjivg.xml.gz', 'https://github.com/KanjiVG/kanjivg/releases/download/r20260714/kanjivg-20260714.xml.gz', 'd4a8e5e11533fe6a5d81a158b2c153964322641d2982c90a919461f3c06dca6b'],
  ['hanviet-hanviet.csv', 'https://raw.githubusercontent.com/ph0ngp/hanviet-pinyin-wordlist/b9923df92c8b55f013001390e37cddd35e986dc1/hanviet.csv', 'dd90d59db1265a47317477c9f741baeff7cb4dfed58d9a0c2be5f69b9ed14d66']
]
const exact = value => String(value ?? '').normalize('NFC').trim()
const array = value => JSON.parse(value || '[]')
const defined = input => Object.fromEntries(Object.entries(input).filter(([, value]) => value !== null && value !== undefined))
const digest = value => createHash('sha256').update(value).digest('hex')
const corpusKey = ({ kind, title, reading }) => [kind, exact(title), kind === 'VOCABULARY' ? exact(reading) : ''].join('|')
const vietnamese = JSON.parse(await readFile(new URL('../data/vietnamese-dictionary.json', import.meta.url), 'utf8'))

async function download([name, url, checksum]) {
  const target = new URL(name, cache)
  try {
    const stored = await readFile(target)
    if (digest(stored) === checksum) return stored
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) })
  if (!response.ok) throw new Error(name + ': HTTP ' + response.status)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (digest(bytes) !== checksum) throw new Error('Checksum không khớp: ' + name)
  await writeFile(target, bytes)
  return bytes
}

function readUnihan(bytes) {
  const entries = unzipSync(bytes, { filter: item => ['Unihan_Readings.txt', 'Unihan_Variants.txt'].includes(item.name) })
  const text = strFromU8(entries['Unihan_Readings.txt'])
  const readings = new Map([...text.matchAll(/^U\+([0-9A-F]+)\tkVietnamese\t(.+)$/gm)]
    .map(match => [String.fromCodePoint(parseInt(match[1], 16)), exact(match[2]).toLocaleUpperCase('vi')]))
  return { readings, variants: strFromU8(entries['Unihan_Variants.txt']) }
}

function readStrokes(bytes) {
  const files = new Map()
  const xml = gunzipSync(bytes).toString('utf8')
  for (const file of xml.matchAll(/<kanji id="kvg:kanji[_:]([\da-f]+)">([\s\S]*?)<\/kanji>/g)) {
    const strokes = [...file[2].matchAll(/<path\s[^>]*?\sd="([^"]+)"/g)].map(match => match[1])
    const components = [...new Set([...file[2].matchAll(/kvg:element="([^"]+)"/g)].map(match => match[1]))]
    if (strokes.length) files.set(String.fromCodePoint(parseInt(file[1], 16)), { strokesSvg: strokes, components })
  }
  return files
}

async function batch(model, rows) {
  let created = 0
  for (let offset = 0; offset < rows.length; offset += 350) {
    const result = await model.createMany({ data: rows.slice(offset, offset + 350), skipDuplicates: true })
    created += result.count
  }
  return created
}

function localize(entry, localized) {
  const { title, summary, meanings, formula, notes, tags, romaji, translationStatus } = localized
  return {
    ...entry, title: title ?? entry.title,
    summary: summary ?? meanings?.slice(0, 2).join('; ') ?? entry.summary,
    topic: entry.kind === 'GRAMMAR' ? tags.join(', ') : entry.topic,
    partOfSpeech: entry.kind === 'VOCABULARY' ? tags.join(', ') : entry.partOfSpeech,
    data: { ...entry.data, ...defined({ meanings, formula, notes, tags, romaji, translationStatus }) }
  }
}

async function updateTranslations(content, examples) {
  let updated = 0
  let translated = 0
  for (let offset = 0; offset < content.length; offset += 250) {
    updated += await db.$executeRaw`
      UPDATE "Content" c SET title = patch.title, summary = patch.summary, topic = patch.topic,
        "partOfSpeech" = patch."partOfSpeech", "hanViet" = patch."hanViet", data = patch.data, "searchText" = patch."searchText",
        "updatedAt" = now()
      FROM jsonb_to_recordset(${JSON.stringify(content.slice(offset, offset + 250))}::jsonb) AS patch(
        id text, title text, summary text, topic text, "partOfSpeech" text, "hanViet" text, data jsonb, "searchText" text, "updatedAt" timestamp
      )
      WHERE c.id = patch.id AND c."sourceId" = ${openjlpt.id} AND c."updatedAt" = patch."updatedAt"
        AND c.data ->> 'translationStatus' = 'PENDING'
    `
  }
  for (let offset = 0; offset < examples.length; offset += 500) {
    translated += await db.$executeRaw`
      UPDATE "Example" e SET vietnamese = CASE WHEN e.vietnamese = '' THEN patch.vietnamese ELSE e.vietnamese END, english = ''
      FROM jsonb_to_recordset(${JSON.stringify(examples.slice(offset, offset + 500))}::jsonb)
        AS patch(id text, vietnamese text, "sourceEnglish" text)
      WHERE e.id = patch.id AND e.english = patch."sourceEnglish"
    `
  }
  return { updated, translated }
}

async function main() {
  await mkdir(cache, { recursive: true })
  const bytes = await Promise.all(pinned.map(download))
  const { readings, variants } = readUnihan(bytes[1])
  const hanVietOf = readHanViet(bytes[3], variants, readings)
  const strokes = readStrokes(bytes[2])
  const sqlite = new DatabaseSync(fileURLToPath(new URL('openjlpt.sqlite', cache)), { readOnly: true })
  const words = sqlite.prepare('SELECT * FROM vocab ORDER BY rowid').all()
  const kanji = sqlite.prepare('SELECT * FROM kanji ORDER BY rowid').all()
  const grammar = sqlite.prepare('SELECT * FROM grammar ORDER BY rowid').all()
  sqlite.close()
  for (const source of [original, openjlpt, unihan, kanjivg, bunchaway, hanVietWordlist]) {
    await db.source.upsert({ where: { id: source.id }, create: source, update: source })
  }

  const existing = await db.content.findMany({
    where: { kind: { in: ['KANJI', 'VOCABULARY', 'GRAMMAR'] } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  })
  const characterReading = new Map(existing.filter(row => row.kind === 'KANJI' && row.hanViet).map(row => [row.title, row.hanViet]))
  const wordHanViet = term => vocabularyHanViet(term, char => hanVietOf(char) || characterReading.get(char)?.replace(/\s+/g, '/'))
  const ids = new Map(existing.map(row => [corpusKey(row), row.id]))
  const bySlug = new Map(existing.map(row => [row.kind + ':' + row.slug, row.id]))
  const localization = new Map()
  const rows = []
  const examples = new Map()
  const attachments = []
  const vocabulary = new Map()
  const characters = new Map()
  const grammars = new Map()
  const ignored = []
  let merged = 0

  function add(entry, exampleRows = []) {
    entry.title = exact(entry.title)
    entry.reading = exact(entry.reading)
    if (!entry.title || !levels.includes(entry.level) || (entry.kind === 'KANJI' && !/^\p{Script=Han}$/u.test(entry.title))) {
      ignored.push(entry.id)
      return null
    }
    const key = corpusKey(entry)
    const prior = bySlug.get(entry.kind + ':' + entry.slug) || ids.get(key)
    const id = prior || entry.id
    const localized = vietnamese.entries[entry.id]
    if (!localized) throw new Error('Thiếu nghĩa tiếng Việt cho ' + entry.id)
    if (!prior) {
      ids.set(key, id)
      bySlug.set(entry.kind + ':' + entry.slug, id)
      const translated = localize(entry, localized)
      rows.push({ ...translated, status: 'PUBLISHED', sourceId: openjlpt.id, searchText: searchable(translated) })
    } else {
      if (prior === entry.id) localization.set(prior, localized)
      merged++
    }
    for (const [index, row] of exampleRows.entries()) {
      if (!row.ja) continue
      const example = {
        japanese: exact(row.ja), reading: exact(row.furigana), vietnamese: '', english: exact(row.en),
        url: row.tatoeba_id ? 'https://tatoeba.org/sentences/show/' + row.tatoeba_id : openjlpt.url,
        credit: row.tatoeba_id ? 'Tatoeba · CC BY 2.0 FR' : 'OpenJLPT · CC BY-SA 4.0'
      }
      const exampleKey = exampleId(example)
      const translation = vietnamese.examples[example.english] || ''
      if (example.english && !translation) throw new Error('Thiếu bản dịch câu ví dụ ' + exampleKey)
      examples.set(exampleKey, { id: exampleKey, ...example, vietnamese: translation, english: '', sourceEnglish: example.english })
      attachments.push({ contentId: id, exampleId: exampleKey, order: 10 + index })
    }
    return id
  }

  for (const [index, row] of kanji.entries()) {
    const id = add({
      id: 'open-k-' + row.character.codePointAt(0).toString(16),
      slug: row.character, title: row.character, kind: 'KANJI', level: row.level, reading: '',
      hanViet: hanVietOf(row.character) || readings.get(row.character) || '', strokes: row.strokes > 0 ? row.strokes : null, radical: row.radical || '',
      summary: array(row.meanings).join('; '), order: 200 + index,
      data: defined({ on: array(row.onyomi), kun: array(row.kunyomi), nanori: array(row.nanori), meanings: array(row.meanings),
        grade: row.grade, frequency: row.freq, translationStatus: 'PENDING', ...strokes.get(row.character) })
    })
    if (id) characters.set(row.character, id)
  }
  for (const [index, row] of words.entries()) {
    const codes = array(row.pos)
    const id = add({
      id: 'open-v-' + row.id, slug: row.id, title: row.word, kind: 'VOCABULARY', level: row.level, reading: row.reading,
      partOfSpeech: codes.join(', '), summary: array(row.meanings).join('; '), order: 200 + index, hanViet: wordHanViet(row.word),
      data: defined({ romaji: row.romaji, meanings: array(row.meanings), tags: codes,
        otherForms: array(row.other_forms), otherReadings: array(row.other_readings), jmdictId: row.jmdict_id, translationStatus: 'PENDING' })
    }, array(row.examples))
    if (id) vocabulary.set(id, [row.word, ...array(row.other_forms)].join(''))
  }
  for (const [index, row] of grammar.entries()) {
    const id = add({
      id: 'open-g-' + row.id, slug: row.id, title: row.pattern, reading: row.reading || '',
      kind: 'GRAMMAR', level: row.level, summary: row.meaning, order: 200 + index,
      topic: array(row.tags).join(', '),
      data: defined({ romaji: row.romaji, formula: row.formation, notes: row.notes, tags: array(row.tags), translationStatus: 'PENDING' })
    }, array(row.examples))
    if (id) grammars.set(id, array(row.examples).map(example => example.ja || ''))
  }
  const created = await batch(db.content, rows)
  const exampleRows = [...examples.values()]
  await batch(db.example, exampleRows.map(({ sourceEnglish: _sourceEnglish, ...example }) => example))
  await batch(db.contentExample, attachments)

  const missingMedia = []
  const missingWordReadings = []
  const contentTranslations = []
  for (const row of existing) {
    let current = row
    if (row.kind === 'KANJI') {
      characters.set(row.title, row.id)
      const media = strokes.get(row.title)
      const hanViet = row.hanViet || hanVietOf(row.title) || readings.get(row.title)
      if ((media && !row.data.strokesSvg?.length) || (hanViet && !row.hanViet)) {
        const data = row.data.strokesSvg?.length ? row.data : { ...row.data, ...media }
        current = { ...row, data, hanViet }
      }
    }
    if (row.kind === 'VOCABULARY' && !row.hanViet) {
      const hanViet = wordHanViet(row.title)
      if (hanViet) current = { ...row, hanViet }
    }
    const translation = localization.get(row.id)
    if (translation && row.sourceId === openjlpt.id && row.data.translationStatus === 'PENDING') {
      const { id, title, summary, topic, partOfSpeech, data, hanViet, updatedAt } = localize(current, translation)
      contentTranslations.push({ id, title, summary, topic, partOfSpeech, data, hanViet, searchText: searchable({ ...current, title, summary, topic, partOfSpeech, data }), updatedAt })
    } else if (row.kind === 'VOCABULARY' && current !== row) {
      missingWordReadings.push({ id: row.id, hanViet: current.hanViet, searchText: searchable(current), updatedAt: row.updatedAt })
    } else if (current !== row) {
      missingMedia.push(db.content.update({ where: { id: row.id }, data: { data: current.data, hanViet: current.hanViet, searchText: searchable(current) } }))
    }
    if (row.kind === 'VOCABULARY' && !vocabulary.has(row.id)) vocabulary.set(row.id, row.title)
  }
  for (let offset = 0; offset < missingMedia.length; offset += 80) {
    await db.$transaction(missingMedia.slice(offset, offset + 80))
  }
  const translations = await updateTranslations(contentTranslations, exampleRows.filter(row => row.sourceEnglish))
  let addedWordReadings = 0
  for (let offset = 0; offset < missingWordReadings.length; offset += 500) {
    addedWordReadings += await db.$executeRaw`
      UPDATE "Content" c SET "hanViet" = patch."hanViet", "searchText" = patch."searchText", "updatedAt" = now()
      FROM jsonb_to_recordset(${JSON.stringify(missingWordReadings.slice(offset, offset + 500))}::jsonb)
        AS patch(id text, "hanViet" text, "searchText" text, "updatedAt" timestamp)
      WHERE c.id = patch.id AND c.kind = 'VOCABULARY' AND c."hanViet" = '' AND c."updatedAt" = patch."updatedAt"
    `
  }
  const links = []
  for (const [id, spelling] of vocabulary) {
    for (const char of new Set(spelling)) {
      if (characters.has(char)) links.push({ fromId: id, toId: characters.get(char), label: 'KANJI' })
    }
  }
  const wordsByForm = new Map()
  for (const row of [...rows, ...existing]) {
    if (row.kind === 'VOCABULARY' && /^\p{Script=Han}{2,}$/u.test(row.title)) {
      wordsByForm.set(row.title, row.id)
    }
  }
  for (const [id, sentences] of grammars) {
    for (const sentence of sentences) {
      for (const match of sentence.matchAll(/\p{Script=Han}{2,}/gu)) {
        const toId = wordsByForm.get(match[0])
        if (toId) links.push({ fromId: id, toId, label: 'EXAMPLE_VOCABULARY' })
      }
    }
  }
  const linked = await batch(db.contentLink, links)
  const now = await db.content.findMany({ where: { kind: { in: ['KANJI', 'VOCABULARY', 'GRAMMAR'] } }, select: {
    kind: true, level: true, status: true, data: true, _count: { select: { examples: true } }
  } })
  const distribution = Object.fromEntries(levels.map(level => [level, { KANJI: 0, VOCABULARY: 0, GRAMMAR: 0 }]))
  for (const entry of now) distribution[entry.level][entry.kind]++
  const report = {
    ref, created, skipped: merged, duplicates: merged, linked, ignored, total: now.length,
    reviewedVietnamese: now.filter(row => row.data.translationStatus === 'REVIEWED').length,
    sourcedVietnamese: now.filter(row => row.data.translationStatus === 'SOURCE').length,
    machineVietnamese: now.filter(row => row.data.translationStatus === 'MACHINE').length,
    pendingVietnamese: now.filter(row => row.data.translationStatus === 'PENDING').length,
    ...translations, addedWordReadings,
    published: now.filter(row => row.status === 'PUBLISHED').length,
    withExamples: now.filter(row => row._count.examples > 0).length,
    withStrokeOrder: now.filter(row => row.data.strokesSvg?.length > 0).length,
    withAudio: now.filter(row => row.data.audioUrl).length,
    sha256: Object.fromEntries(pinned.map(([name], index) => [name, digest(bytes[index])])),
    distribution
  }
  await db.importJob.create({ data: { label: 'OpenJLPT + Unihan + KanjiVG + tiếng Việt', report } })
  console.log(JSON.stringify(report, null, 2))
}
try {
  await main()
} finally {
  await db.$disconnect()
}

