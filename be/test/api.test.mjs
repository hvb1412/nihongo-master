import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import app from '../src/app.mjs'
import { db } from '../src/config.mjs'

const api = request(app)
afterAll(() => db.$disconnect())

describe('Thư viện học tiếng Nhật', () => {
  it('kết nối PostgreSQL và chỉ mở năm mục học', async () => {
    await api.get('/api/health').expect(200).expect('Cache-Control', 'no-store')
    for (const kind of ['kanji', 'vocabulary', 'grammar', 'reading', 'listening']) {
      const { body } = await api.get('/api/catalog/' + kind).query({ level: 'N5', limit: 1 }).expect(200)
        .expect('Cache-Control', /^public, max-age=\d+$/)
      expect(body.data.items[0]).toMatchObject({ kind: kind.toUpperCase(), level: 'N5' })
    }
    for (const path of ['auth/me', 'study/dashboard', 'quiz', 'admin/summary', 'catalog/path/N5', 'catalog/sample-quiz',
      'catalog/exam', 'catalog/lesson', 'catalog/entries/n5-exam', 'catalog/entries/n5-lesson-1']) {
      await api.get('/api/' + path).expect(404).expect('Cache-Control', 'no-store')
    }
    await api.post('/api/auth/login').send({}).expect(404)
  })

  it('tra cả từ 勉強, tìm theo các cách đọc và hiển thị nghĩa, ví dụ tiếng Việt', async () => {
    const search = async q => (await api.get('/api/catalog/search').query({ q }).expect(200)).body.data
    const groups = await search('勉強')
    const word = groups.VOCABULARY.items[0]
    expect(word).toMatchObject({ title: '勉強', reading: 'べんきょう', level: 'N5' })
    expect(groups.KANJI.items.slice(0, 2).map(entry => entry.title)).toEqual(['勉', '強'])
    for (const term of ['べんきょう', 'ﾍﾞﾝｷｮｳ', 'benkyō', '勉強しました']) {
      expect((await search(term)).VOCABULARY.items[0].id).toBe(word.id)
    }
    expect((await search('hoc tap')).VOCABULARY.count).toBeGreaterThan(0)
    expect((await search('%_')).VOCABULARY.count).toBe(0)
    const filtered = (await api.get('/api/catalog/vocabulary').query({ q: '勉強', level: 'N1' }).expect(200)).body.data
    expect(filtered.items.some(entry => entry.id === word.id)).toBe(false)
    const details = (await api.get('/api/catalog/entries/' + word.id).expect(200)).body.data
    expect(details.data.meanings).toContain('Học, học tập; việc học')
    expect(details.examples).toEqual(expect.arrayContaining([
      expect.objectContaining({ vietnamese: 'Bạn đã học được bao nhiêu tiếng rồi?' })
    ]))
    expect(details.examples[0]).not.toHaveProperty('english')
    expect(details.links.every(({ entry }) => ['KANJI', 'VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING'].includes(entry.kind))).toBe(true)
  })

  it('phân trang, tìm bằng nghĩa không dấu và tải nội dung đọc nghe', async () => {
    const { body } = await api.get('/api/catalog/kanji').query({ q: 'ngay mat troi', level: 'N5', limit: 1 }).expect(200)
    expect(body.data.items[0].title).toBe('日')
    expect(body.data.limit).toBe(1)
    await api.get('/api/catalog/grammar').query({ page: 0 }).expect(400)
    const reading = (await api.get('/api/catalog/entries/n5-reading').expect(200)).body.data
    expect(reading.data).toMatchObject({ body: expect.stringContaining('学校'), translation: expect.stringContaining('đến trường') })
    const listening = (await api.get('/api/catalog/entries/n5-listening').expect(200)).body.data
    expect(listening.data).toMatchObject({ audioUrl: '/audio/n5.wav', translation: expect.stringContaining('nhà ga') })
    expect(reading.links.every(({ entry }) => ['KANJI', 'VOCABULARY', 'GRAMMAR'].includes(entry.kind))).toBe(true)
    const sources = (await api.get('/api/catalog/sources').expect(200)).body.data
    expect(sources.map(item => item.id)).toContain('bunchaway-ja-vi')
  })

  it('tạo bộ thẻ từ toàn bộ mục công khai và giữ bộ lọc cấp độ khi phân trang', async () => {
    const readDeck = async (kind, query) => (await api.get('/api/catalog/flashcards/' + kind).query(query).expect(200)).body.data
    for (const kind of ['vocabulary', 'kanji']) {
      const catalog = (await api.get('/api/catalog/' + kind).query({ limit: 1 }).expect(200)).body.data
      const deck = await readDeck(kind, { limit: 1 })
      expect(deck.count).toBe(catalog.count)
      expect(deck.items[0].id).toBe(catalog.items[0].id)
      expect(deck.items[0]).not.toHaveProperty('data')
    }
    const filters = { level: 'N5', limit: 1 }
    const vocabulary = await readDeck('vocabulary', filters)
    expect(vocabulary.items[0]).toMatchObject({ title: '学生', level: 'N5', reading: 'がくせい' })
    const kanji = await readDeck('kanji', filters)
    expect(kanji.items[0]).toMatchObject({ title: '日', level: 'N5', on: ['ニチ', 'ジツ'], kun: ['ひ', 'か'] })
    const next = await readDeck('kanji', { ...filters, page: 2 })
    expect(next.items[0]).toMatchObject({ title: '学', level: 'N5' })
    expect(next.count).toBe(kanji.count)
    await api.get('/api/catalog/flashcards/grammar').expect(400)
  })
})
