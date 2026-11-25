import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import kuromoji from 'kuromoji'

const require = createRequire(import.meta.url)
const dictionary = join(dirname(require.resolve('kuromoji/package.json')), 'dict')
const han = /[\p{Script=Han}々〆]/u
const ruby = /(\{[^{}|]+\|[^{}|]+\})/g
const kana = /[\p{Script=Hiragana}\p{Script=Katakana}]/u
let tokenizerPromise

export function getTokenizer() {
  tokenizerPromise ??= new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: dictionary }).build((error, tokenizer) => error ? reject(error) : resolve(tokenizer))
  })
  return tokenizerPromise
}

function hiragana(text) {
  return text.replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
}

function align(text, reading) {
  const parts = text.split(/([\p{Script=Han}々〆]+)/u)
  const pattern = parts.map((part, index) => index % 2 ? '([ぁ-ゖー]+?)' : hiragana(part).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')
  const match = hiragana(reading).match(new RegExp('^' + pattern + '$', 'u'))
  return match ? parts.map((part, index) => index % 2 ? `{${part}|${match[(index + 1) / 2]}}` : part).join('') : undefined
}

export function annotate(text, reading, tokenizer) {
  if (!text || !han.test(text)) return text
  if (reading?.includes('{') && reading.replace(/\{([^{}|]+)\|[^{}|]+\}/g, '$1') === text) {
    return reading.split(ruby).map((part, index) => index % 2 ? part : annotate(part, undefined, tokenizer)).join('')
  }
  if (reading && kana.test(reading) && !han.test(reading)) {
    return align(text, reading) || `{${text}|${hiragana(reading)}}`
  }
  return text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ー]+/gu, word => {
    if (!han.test(word)) return word
    return tokenizer.tokenize(word).map(token => {
      const surface = token.surface_form
      if (!han.test(surface) || !token.reading || !kana.test(token.reading)) return surface
      return align(surface, token.reading) || `{${surface}|${hiragana(token.reading)}}`
    }).join('')
  })
}

export function entryFurigana(entry, data, tokenizer) {
  const reading = entry.reading || (data?.on?.[0] || data?.kun?.[0])?.split('.')[0].replace(/^-|-$/g, '')
  return annotate(entry.title, reading, tokenizer)
}

export function entryAnnotations(entry, data, tokenizer) {
  const fields = [entry.summary, entry.radical, entry.topic, entry.partOfSpeech, data?.formula, data?.explanation,
    data?.notes, data?.transitivity, data?.formGroup, data?.register, data?.pitch, ...(data?.meanings ?? []),
    data?.components?.filter(item => item !== entry.title).join('・'), data?.otherForms?.join('・'), ...Object.values(data?.conjugations ?? {})]
  return Object.fromEntries([...new Set(fields)].filter(value => typeof value === 'string' && han.test(value))
    .map(value => [value, annotate(value, undefined, tokenizer)]))
}
