import { access } from 'node:fs/promises'
import { db } from '../src/config.mjs'
import { exampleId, searchable } from '../src/services/content-data.mjs'
import { curriculum } from './curriculum.mjs'
import { original } from './sources.mjs'

const sourceId = original.id
const published = 'PUBLISHED'
const example = (japanese, reading, vietnamese) => ({ japanese, reading, vietnamese, english: '', url: '', credit: 'Nihongo Master' })

async function entry(id, fields, examples = []) {
  const reading = fields.reading ?? ''
  const known = ['KANJI', 'VOCABULARY', 'GRAMMAR'].includes(fields.kind)
    ? await db.content.findFirst({ where: { kind: fields.kind, title: fields.title, ...(fields.kind === 'VOCABULARY' ? { reading } : {}) } })
    : null
  const key = known?.id ?? id
  const data = known?.data && known.sourceId === 'openjlpt' ? { ...known.data, ...fields.data } : fields.data ?? {}
  const slug = fields.slug ?? (fields.kind === 'KANJI' ? fields.title : id)
  const normalized = { ...fields, data }
  await db.content.upsert({
    where: { id: key }, create: { id: key, slug, status: published, sourceId, ...normalized, searchText: searchable(normalized) },
    update: known?.sourceId === 'openjlpt' ? {
      summary: fields.summary, topic: fields.topic, order: fields.order, data,
      searchText: searchable({ ...known, ...normalized })
    } : {}
  })
  for (const [order, value] of examples.entries()) {
    const exampleKey = exampleId(value)
    await db.example.upsert({ where: { id: exampleKey }, create: { id: exampleKey, ...value }, update: {} })
    await db.contentExample.upsert({
      where: { contentId_exampleId: { contentId: key, exampleId: exampleKey } },
      create: { contentId: key, exampleId: exampleKey, order }, update: {}
    })
  }
  return key
}
async function link(fromId, toId, label, order = 0) {
  await db.contentLink.upsert({ where: { fromId_toId_label: { fromId, toId, label } }, create: { fromId, toId, label, order }, update: {} })
}
async function seedLevel(row) {
  const { level, topic } = row
  const tag = level.toLowerCase()
  const metadata = { level, topic }
  const kanji = []
  const vocabulary = []
  const grammar = []
  for (const [index, [title, hanViet, on, kun, summary, radical, strokes]] of row.kanji.entries()) {
    const contentId = await entry(tag + '-kanji-' + index, { ...metadata, kind: 'KANJI', title, hanViet, summary, radical, strokes, order: index,
      data: { on, kun, translationStatus: 'REVIEWED' } })
    kanji.push(contentId)
  }
  for (const [index, [title, reading, summary, partOfSpeech, ja, furigana, vi, extra]] of row.vocabulary.entries()) {
    const contentId = await entry(tag + '-word-' + index, { ...metadata, kind: 'VOCABULARY', title, reading, summary, partOfSpeech, order: index,
      data: { ...extra, translationStatus: 'REVIEWED' } }, [example(ja, furigana, vi)])
    vocabulary.push(contentId)
    for (const [kanjiIndex, [char]] of row.kanji.entries()) if (title.includes(char)) await link(contentId, kanji[kanjiIndex], 'KANJI')
  }
  for (const [index, [title, summary, formula, explanation, ja, furigana, vi]] of row.grammar.entries()) {
    const contentId = await entry(tag + '-grammar-' + index, { ...metadata, kind: 'GRAMMAR', title, summary, order: index,
      data: { formula, explanation, translationStatus: 'REVIEWED' } }, [example(ja, furigana, vi)])
    grammar.push(contentId)
    for (const [vocabIndex, [word]] of row.vocabulary.entries()) if (ja.includes(word)) await link(contentId, vocabulary[vocabIndex], 'EXAMPLE_VOCABULARY')
  }
  for (const [index, id] of grammar.entries()) if (index > 0) await link(grammar[index - 1], id, 'RELATED_GRAMMAR')
  const [readingTitle, body, furigana, translation] = row.reading
  const readId = await entry(tag + '-reading', { ...metadata, kind: 'READING', title: readingTitle,
    summary: 'Bài đọc hiểu theo chủ đề ' + topic.toLowerCase() + '.', data: { body, furigana, translation, minutes: 4 } })
  for (const group of [kanji, vocabulary, grammar]) {
    for (const [index, id] of group.entries()) await link(readId, id, 'READING_REFERENCE', index)
  }

  const [listenTitle, transcript, listenTranslation] = row.listening
  const audioPath = '/audio/' + tag + '.wav'
  const hasAudio = await access(new URL('../../fe/public' + audioPath, import.meta.url)).then(() => true, () => false)
  const listenData = { body: transcript, translation: listenTranslation, minutes: 3, ...(hasAudio ? { audioUrl: audioPath } : {}) }
  const listenId = await entry(tag + '-listening', { ...metadata, kind: 'LISTENING', title: listenTitle,
    summary: 'Nghe đoạn nói và đối chiếu bản chép lời.', data: listenData })
  if (hasAudio) {
    const current = await db.content.findUnique({ where: { id: listenId } })
    if (!current.data.audioUrl) await db.content.update({ where: { id: listenId }, data: { data: { ...current.data, audioUrl: audioPath } } })
  }
  for (const [index, id] of vocabulary.entries()) await link(listenId, id, 'LISTENING_REFERENCE', index)
}

try {
  await db.source.upsert({ where: { id: original.id }, create: original, update: original })
  for (const row of curriculum) await seedLevel(row)
  console.log('Đã nạp từ vựng, ngữ pháp, Kanji, bài đọc và bài nghe theo 5 cấp JLPT.')
} finally {
  await db.$disconnect()
}
