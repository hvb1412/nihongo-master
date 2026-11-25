import { parse } from 'csv-parse/sync'

const preferredReadings = {
  上: 'THƯỢNG', 下: 'HẠ', 中: 'TRUNG', 和: 'HÒA', 地: 'ĐỊA', 強: 'CƯỜNG',
  数: 'SỐ', 明: 'MINH', 楽: 'LẠC/NHẠC', 生: 'SINH', 率: 'SUẤT', 着: 'TRƯỚC',
  空: 'KHÔNG', 行: 'HÀNH', 重: 'TRỌNG/TRÙNG', 長: 'TRƯỜNG/TRƯỞNG', 顕: 'HIỂN',
  食: 'THỰC', 著: 'TRỨ', 勉: 'MIỄN', 校: 'HIỆU'
}
const wordReadings = {
  勉強: 'MIỄN CƯỠNG', 音楽: 'ÂM NHẠC', 旅行: 'LỮ HÀNH',
  重要: 'TRỌNG YẾU', 重複: 'TRÙNG PHỨC', 社長: 'XÃ TRƯỞNG', 校長: 'HIỆU TRƯỞNG',
  長所: 'TRƯỜNG SỞ'
}
const characterOf = code => String.fromCodePoint(Number.parseInt(code, 16))

export function readHanViet(csv, variants, unihan) {
  const readings = new Map()
  for (const { char, hanviet } of parse(csv, { columns: true })) {
    if (!readings.has(char)) readings.set(char, new Set())
    for (const [, reading] of hanviet.matchAll(/'([\p{L}\p{M}]+)'/gu)) {
      readings.get(char).add(reading.normalize('NFC').toLocaleUpperCase('vi'))
    }
  }

  const variantSets = new Map()
  for (const [, code, type, values] of variants.matchAll(/^U\+([0-9A-F]+)\tk(TraditionalVariant|SemanticVariant)\t(.+)$/gm)) {
    const char = characterOf(code)
    const options = [...values.matchAll(/(?:^|\s)U\+([0-9A-F]+)/g)].map(([, target]) => characterOf(target)).filter(target => target !== char)
    if (!variantSets.has(char)) variantSets.set(char, {})
    variantSets.get(char)[type] = options
  }

  return char => {
    if (preferredReadings[char]) return preferredReadings[char]
    if (readings.get(char)?.size) return [...readings.get(char)].join('/')
    const variant = variantSets.get(char)
    if (variant?.TraditionalVariant?.length === 1) {
      const traditional = readings.get(variant.TraditionalVariant[0])
      if (traditional?.size) return [...traditional].join('/')
    }
    if (variant?.SemanticVariant?.length === 1) {
      const alternative = variant.SemanticVariant[0]
      if (variantSets.get(alternative)?.SemanticVariant?.includes(char) && readings.get(alternative)?.size) {
        return [...readings.get(alternative)].join('/')
      }
    }
    const vietnamese = unihan.get(char)
    if (vietnamese && !vietnamese.includes(' ')) return vietnamese
    return ''
  }
}

export function vocabularyHanViet(title, readingOf) {
  if (wordReadings[title]) return wordReadings[title]
  const ideographs = title.replace(/(\p{Unified_Ideograph})々/gu, '$1$1').match(/\p{Unified_Ideograph}/gu)
  if (!ideographs?.length) return ''
  const readings = ideographs.map(readingOf)
  return readings.every(Boolean) ? readings.join(' ') : ''
}
