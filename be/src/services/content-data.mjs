import { createHash } from 'node:crypto'
import { fold } from '../utils.mjs'

export function searchable(entry) {
  const plainKun = entry.data?.kun?.filter(reading => reading.includes('.')).map(reading => reading.replace('.', ''))
  return fold([
    entry.title, entry.reading, entry.summary, entry.hanViet, entry.radical, entry.topic, entry.partOfSpeech,
    entry.data?.on, entry.data?.kun, entry.data?.romaji, entry.data?.formula, entry.data?.meanings,
    entry.data?.otherForms, entry.data?.otherReadings, entry.data?.tags, plainKun
  ].flat().join(' '))
}

export function exampleId(example) {
  const fields = [example.japanese, example.reading, example.vietnamese, example.english, example.url, example.credit]
  return 'example-' + createHash('sha256').update(fields.join('\n')).digest('hex').slice(0, 24)
}
