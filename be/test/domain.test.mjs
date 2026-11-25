import { describe, expect, it } from 'vitest'
import { fold } from '../src/utils.mjs'
import { searchable } from '../src/services/content-data.mjs'

describe('Chuẩn hóa tra cứu', () => {
  it('bỏ dấu tiếng Việt và quy Katakana về Hiragana với dấu âm đục', () => {
    expect(fold('ĐI HỌC')).toBe('di hoc')
    expect(fold('ガッコウ')).toBe('がっこう')
    expect(fold('が')).not.toBe(fold('か'))
  })
  it('lập chỉ mục cách viết, cách đọc và các nghĩa tiếng Việt', () => {
    const text = searchable({
      title: '勉強', reading: 'べんきょう',
      data: { romaji: 'benkyou', meanings: ['học tập', 'sự nỗ lực'] }
    })
    expect(text).toBe('勉強 べんきょう benkyou hoc tap su no luc')
  })
  it('lập chỉ mục âm Kun có ranh giới okurigana và cả dạng viết liền', () => {
    const text = searchable({ title: '生', data: { kun: ['い.きる', 'う.まれる', 'なま'] } })
    expect(text).toBe('生 い.きる う.まれる なま いきる うまれる')
  })
})
