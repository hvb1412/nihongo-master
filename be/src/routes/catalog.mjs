import { Router } from 'express'
import { z } from 'zod'
import { db } from '../config.mjs'
import { idSchema, knowledgeKinds, levelSchema, pagination, send, studyKinds, HttpError } from '../utils.mjs'
import { getContent, listBook, listContent, listFlashcards, searchContent } from '../services/catalog.mjs'

export const catalogRoutes = Router()
const query = z.object({ ...pagination, q: z.string().trim().max(100).optional(), level: levelSchema.optional() })
const flashcardKind = z.enum(['VOCABULARY', 'KANJI'])
const bookKind = z.enum(knowledgeKinds)
const flashcardQuery = query.omit({ q: true })
const responses = new Map()
const maxAge = 120
const cacheLimit = 256

async function sendCatalog(res, key, load) {
  const id = JSON.stringify(key)
  let response = responses.get(id)
  if (!response || response.expires <= Date.now()) {
    response = { value: Promise.resolve().then(load), expires: Infinity }
    responses.set(id, response)
    if (responses.size > cacheLimit) responses.delete(responses.keys().next().value)
  }
  try {
    const value = await response.value
    if (response.expires === Infinity) response.expires = Date.now() + maxAge * 1000
    res.set('Cache-Control', 'public, max-age=' + Math.max(0, Math.floor((response.expires - Date.now()) / 1000)))
    send(res, value)
  } catch (error) {
    if (responses.get(id) === response) responses.delete(id)
    throw error
  }
}

catalogRoutes.get('/sources', (req, res) => sendCatalog(res, ['sources'], () => db.source.findMany({ orderBy: { name: 'asc' } })))
catalogRoutes.get('/search', async (req, res) => {
  const filters = query.extend({ q: z.string().trim().min(1).max(100), limit: pagination.limit.default(3) }).parse(req.query)
  await sendCatalog(res, ['search', filters], () => searchContent(filters))
})
catalogRoutes.get('/flashcards/:kind', async (req, res) => {
  const kind = flashcardKind.parse(req.params.kind.toUpperCase())
  const filters = flashcardQuery.parse(req.query)
  await sendCatalog(res, ['flashcards', kind, filters], () => listFlashcards(kind, filters))
})
catalogRoutes.get('/book/:kind', async (req, res) => {
  const kind = bookKind.parse(req.params.kind.toUpperCase())
  const filters = query.parse(req.query)
  await sendCatalog(res, ['book', kind, filters], () => listBook(kind, filters))
})
catalogRoutes.get('/entries/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  await sendCatalog(res, ['entry', id], () => getContent(id))
})
catalogRoutes.get('/:kind', async (req, res) => {
  const kind = req.params.kind.toUpperCase()
  if (!studyKinds.includes(kind)) throw new HttpError(404, 'Không tìm thấy đường dẫn.')
  const filters = query.parse(req.query)
  await sendCatalog(res, ['list', kind, filters], () => listContent(kind, filters))
})
