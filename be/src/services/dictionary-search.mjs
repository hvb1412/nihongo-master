import { Prisma } from '@prisma/client'
import { fold } from '../utils.mjs'

const segmenter = new Intl.Segmenter('ja', { granularity: 'word' })
const kana = Array.from({ length: 86 }, (_, index) => String.fromCharCode(0x30A1 + index))
const katakana = kana.join('')
const hiragana = kana.map(char => String.fromCharCode(char.charCodeAt(0) - 0x60)).join('')
const han = /\p{Script=Han}/gu
const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
const romaji = value => value.replace(/[\s'’-]+/g, '').replace(/ou|([aeiou])\1/g, vowel => vowel[0])
const like = value => value.replace(/[\\%_]/g, '\\$&')
const foldedKana = field => Prisma.sql`translate(lower(normalize(${field}, NFKC)), ${katakana}, ${hiragana})`
const fromJson = field => Prisma.sql`jsonb_array_elements_text(coalesce(c.data -> ${field}::text, '[]'::jsonb))`

export function dictionaryMatches(kind, query) {
  const term = fold(query.q)
  const matchText = term.split(' ').map(token => Prisma.sql`c."searchText" LIKE ${'%' + like(token) + '%'}`)
  const title = foldedKana(Prisma.sql`c.title`)
  const reading = foldedKana(Prisma.sql`c.reading`)
  const aliases = Prisma.sql`${term} IN (SELECT ${foldedKana(Prisma.sql`alias`)}
    FROM ${fromJson('otherForms')} AS alias UNION ALL SELECT ${foldedKana(Prisma.sql`alias`)} FROM ${fromJson('otherReadings')} AS alias)`
  const latin = /^[a-z][a-z\s'’-]*$/.test(term)
  const transliteration = latin ? Prisma.sql`regexp_replace(
    regexp_replace(regexp_replace(lower(c.data ->> 'romaji'), '[[:space:]''’-]+', '', 'g'), 'ou', 'o', 'g'),
    ${'([aeiou])\\1'}, ${'\\1'}, 'g') = ${romaji(term)}` : Prisma.sql`false`
  const segments = japanese.test(term) ? [...new Set([...segmenter.segment(term)]
    .filter(({ segment, isWordLike }) => isWordLike && segment !== term && japanese.test(segment) &&
      ([...segment].length > 1 || /^\p{Script=Han}$/u.test(segment)))
    .map(({ segment }) => segment))].slice(0, 12) : []
  const kanji = kind === 'KANJI' ? [...new Set(term.match(han) || [])] : []
  const related = [...new Set([...kanji, ...segments])]
  const constituent = related.length ? Prisma.sql`${title} IN (${Prisma.join(related)})` : Prisma.sql`false`
  const position = related.length ? Prisma.sql`array_position(ARRAY[${Prisma.join(related)}]::text[], ${title})` : Prisma.sql`null::int`
  const constraints = [Prisma.sql`c.kind = ${kind}::"Kind"`, Prisma.sql`c.status = 'PUBLISHED'`]
  if (query.level) constraints.push(Prisma.sql`c.level = ${query.level}::"Level"`)
  return Prisma.sql`
    WITH matched AS (
      SELECT c.id, c."order", ${position} AS position,
        CASE
          WHEN ${title} = ${term} THEN 0
          WHEN ${reading} = ${term} OR ${aliases} OR ${transliteration} THEN 1
          WHEN ${constituent} THEN 2
          WHEN ${title} LIKE ${like(term) + '%'} OR ${reading} LIKE ${like(term) + '%'} THEN 3
          WHEN c."searchText" LIKE ${'%' + like(term) + '%'} THEN 4
          ELSE 5
        END AS rank
      FROM "Content" c WHERE ${Prisma.join(constraints, ' AND ')}
        AND ((${Prisma.join(matchText, ' AND ')}) OR ${constituent} OR ${transliteration}
          OR ${title} = ${term} OR ${reading} = ${term} OR ${aliases})
    )
    SELECT count(*)::int AS count, ARRAY(
      SELECT id FROM matched ORDER BY rank, position NULLS LAST, "order", id LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}
    ) AS ids FROM matched
  `
}
