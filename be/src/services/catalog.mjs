import { Prisma } from '@prisma/client'
import { db, mediaUrl } from '../config.mjs'
import { fold, knowledgeKinds, studyKinds, required, pageOf } from '../utils.mjs'
import { dictionaryMatches } from './dictionary-search.mjs'
import { annotate, entryAnnotations, entryFurigana, getTokenizer } from './furigana.mjs'

const cardFields = {
  id: true, kind: true, title: true, level: true, topic: true, summary: true, reading: true,
  hanViet: true, radical: true, strokes: true, partOfSpeech: true
}
const published = { status: 'PUBLISHED' }
const furiganaFields = { ...cardFields, data: true }
const publicKinds = Prisma.join(studyKinds.map(kind => Prisma.sql`${kind}::"Kind"`))
// These SQL column lists come from the fixed API projections above.
const columns = (alias, fields) => Prisma.join(Object.keys(fields).map(field => Prisma.raw(alias + '."' + field + '"')))
const exampleFields = { id: true, japanese: true, reading: true, vietnamese: true, url: true, credit: true }
const knowledgeSelection = Prisma.sql`SELECT ${columns('c', furiganaFields)} FROM "Content" c`

function examplesFor(contentId, limit = Prisma.empty) {
  return Prisma.sql`ARRAY(
    SELECT row_to_json(item) FROM (
      SELECT ${columns('example', exampleFields)}
      FROM "ContentExample" attachment JOIN "Example" example ON example.id = attachment."exampleId"
      WHERE attachment."contentId" = ${contentId}
      ORDER BY attachment."order", attachment."exampleId"
      ${limit}
    ) item
  )`
}

function annotatedCard({ data, ...entry }, tokenizer) {
  if (!knowledgeKinds.includes(entry.kind)) return entry
  return { ...entry, furigana: entryFurigana(entry, data, tokenizer), annotations: entryAnnotations(entry, undefined, tokenizer) }
}

function annotatedExample(example, tokenizer) {
  return { ...example, furigana: annotate(example.japanese, example.reading, tokenizer) }
}

export async function listContent(kind, query) {
  if (!knowledgeKinds.includes(kind)) return listPublishedContent(kind, query, cardFields)
  const [page, tokenizer] = await Promise.all([listKnowledge(kind, query), getTokenizer()])
  return { ...page, items: page.items.map(entry => annotatedCard(entry, tokenizer)) }
}

export async function searchContent(query) {
  const groups = knowledgeKinds.map(kind => Prisma.sql`
    SELECT ${kind}::text AS kind, results.* FROM (${rankedPage(kind, query, knowledgeSelection)}) results
  `)
  const [rows, tokenizer] = await Promise.all([db.$queryRaw(Prisma.join(groups, ' UNION ALL ')), getTokenizer()])
  return Object.fromEntries(rows.map(({ kind, items, count }) => [kind,
    pageOf(items.map(entry => annotatedCard(entry, tokenizer)), count, query.page, query.limit)]))
}

async function listKnowledge(kind, query) {
  if (!query.q) return publishedPage(kind, query, knowledgeSelection)
  const [{ items, count }] = await db.$queryRaw(rankedPage(kind, query, knowledgeSelection))
  return pageOf(items, count, query.page, query.limit)
}

function rankedPage(kind, query, selection) {
  return Prisma.sql`
    SELECT matches.count, ARRAY(
      SELECT row_to_json(item) FROM (
        ${selection} JOIN unnest(matches.ids) WITH ORDINALITY ranked(id, position) ON c.id = ranked.id
        ORDER BY ranked.position
      ) item
    ) AS items
    FROM (${dictionaryMatches(kind, query)}) matches
  `
}

export async function listBook(kind, query) {
  const [page, tokenizer] = await Promise.all([listBookEntries(kind, query), getTokenizer()])
  const items = page.items.map(({ examples, ...entry }) => ({
    ...entry, furigana: entryFurigana(entry, entry.data, tokenizer), data: publicData(entry.data),
    annotations: entryAnnotations(entry, entry.data, tokenizer),
    examples: examples.map(example => annotatedExample(example, tokenizer))
  }))
  return { ...page, items }
}

async function listBookEntries(kind, query) {
  const selection = Prisma.sql`SELECT ${columns('c', furiganaFields)}, ${examplesFor(Prisma.sql`c.id`, Prisma.sql`LIMIT 1`)} AS examples FROM "Content" c`
  if (!query.q) return publishedPage(kind, query, selection)
  const [{ items, count }] = await db.$queryRaw(rankedPage(kind, query, selection))
  return pageOf(items, count, query.page, query.limit)
}

async function publishedPage(kind, { q, level, page, limit }, selection) {
  const filters = [Prisma.sql`c.kind = ${kind}::"Kind"`, Prisma.sql`c.status = 'PUBLISHED'`]
  if (level) filters.push(Prisma.sql`c.level = ${level}::"Level"`)
  for (const term of fold(q ?? '').split(' ').filter(Boolean)) {
    const pattern = '%' + term.replace(/[\\%_]/g, '\\$&') + '%'
    filters.push(Prisma.sql`c."searchText" LIKE ${pattern}`)
  }
  const where = Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
  const [{ items, count }] = await db.$queryRaw`
    SELECT ARRAY(
      SELECT row_to_json(item) FROM (
        ${selection} ${where}
        ORDER BY c."order", c.id LIMIT ${limit} OFFSET ${(page - 1) * limit}
      ) item
    ) AS items, (SELECT count(*)::int FROM "Content" c ${where}) AS count
  `
  return pageOf(items, count, page, limit)
}

function publicData(data) {
  return { ...data, ...(data.audioUrl && { audioUrl: mediaUrl(data.audioUrl) }), ...(data.strokeUrl && { strokeUrl: mediaUrl(data.strokeUrl) }) }
}

function listPublishedContent(kind, query, fields) {
  return publishedPage(kind, query, Prisma.sql`SELECT ${columns('c', fields)} FROM "Content" c`)
}

export async function listFlashcards(kind, query) {
  const [page, tokenizer] = await Promise.all([listPublishedContent(kind, query, {
    id: true, title: true, level: true, reading: true, summary: true, hanViet: true, data: true
  }), getTokenizer()])
  const items = page.items.map(({ data, ...entry }) => ({
    ...entry, furigana: entryFurigana(entry, data, tokenizer), annotations: entryAnnotations(entry, data, tokenizer),
    meanings: data?.meanings ?? [], on: data?.on ?? [], kun: data?.kun ?? []
  }))
  return { ...page, items }
}

function linksFor(direction) {
  const outgoing = direction === 'outgoing'
  const remote = outgoing ? Prisma.sql`link."toId"` : Prisma.sql`link."fromId"`
  const local = outgoing ? Prisma.sql`link."fromId"` : Prisma.sql`link."toId"`
  return Prisma.sql`ARRAY(
    SELECT json_build_object('label', item.label, 'entry', item.entry)
    FROM (
      SELECT link.label, (
        SELECT row_to_json(card) FROM (SELECT ${columns('other', furiganaFields)}) card
      ) AS entry
      FROM "ContentLink" link JOIN "Content" other ON other.id = ${remote}
      WHERE ${local} = c.id AND other.status = 'PUBLISHED' AND other.kind IN (${publicKinds})
      ORDER BY link."order", ${remote}, link.label
      LIMIT ${outgoing ? 100 : 80}
    ) item
  )`
}

export async function getContent(id) {
  const [[result], tokenizer] = await Promise.all([db.$queryRaw`
    SELECT ${columns('c', furiganaFields)}, row_to_json(source) AS source,
      ${examplesFor(Prisma.sql`c.id`)} AS examples,
      ${linksFor('outgoing')} AS "linksFrom", ${linksFor('incoming')} AS "linksTo"
    FROM "Content" c LEFT JOIN "Source" source ON source.id = c."sourceId"
    WHERE c.id = ${id} AND c.status = 'PUBLISHED' AND c.kind IN (${publicKinds})
  `, getTokenizer()])
  const { linksFrom, linksTo, examples, ...details } = required(result)
  details.data = publicData(details.data)
  if (details.data.body) details.data.furigana = annotate(details.data.body, details.data.furigana, tokenizer)
  const links = new Map()
  for (const link of linksFrom) links.set(link.entry.id, link)
  for (const link of linksTo) if (!links.has(link.entry.id)) links.set(link.entry.id, link)
  if (details.kind === 'KANJI' && details.radical) {
    const variants = await db.content.findMany({
      where: { ...published, kind: 'KANJI', id: { notIn: [id, ...links.keys()] }, radical: details.radical, level: details.level },
      select: furiganaFields, orderBy: [{ strokes: 'asc' }, { id: 'asc' }], take: 6
    })
    for (const entry of variants) links.set(entry.id, { label: 'SAME_RADICAL', entry })
  }
  return {
    ...details, furigana: entryFurigana(details, details.data, tokenizer), annotations: entryAnnotations(details, details.data, tokenizer),
    links: [...links.values()].map(link => ({ ...link, entry: annotatedCard(link.entry, tokenizer) })),
    examples: examples.map(example => annotatedExample(example, tokenizer))
  }
}
