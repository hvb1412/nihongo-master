import { z } from 'zod'

export const levels = ['N5', 'N4', 'N3', 'N2', 'N1']
export const knowledgeKinds = ['KANJI', 'VOCABULARY', 'GRAMMAR']
export const studyKinds = [...knowledgeKinds, 'READING', 'LISTENING']

export const levelSchema = z.enum(levels)
export const idSchema = z.string().min(1).max(160)
export const pagination = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(18)
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
export function required(value, message = 'Không tìm thấy nội dung.') {
  if (!value) throw new HttpError(404, message)
  return value
}
export function normalize(value) {
  return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}
export function fold(value) {
  return normalize(value).replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .normalize('NFD').replace(/(?<=\p{Script=Latin})[\u0300-\u036f]+/gu, '').replace(/đ/g, 'd').normalize('NFC')
}
export const send = (res, data) => res.json({ data })
export const pageOf = (items, count, page, limit) => ({ items, count, page, limit, pages: Math.ceil(count / limit) })

