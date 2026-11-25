export const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const
export const knowledgeKinds = ['KANJI', 'VOCABULARY', 'GRAMMAR'] as const
export type Level = typeof levels[number]
export type KnowledgeKind = typeof knowledgeKinds[number]
export type StudyKind = KnowledgeKind | 'READING' | 'LISTENING'

export const kindLabel: Record<StudyKind, string> = {
  KANJI: 'Kanji', VOCABULARY: 'Từ vựng', GRAMMAR: 'Ngữ pháp', READING: 'Luyện đọc', LISTENING: 'Luyện nghe'
}
export const kindRoute: Record<StudyKind, string> = {
  KANJI: '/kanji', VOCABULARY: '/tu-vung', GRAMMAR: '/ngu-phap', READING: '/doc', LISTENING: '/nghe'
}
export const flashcardsRoute = '/flashcard'
export const bookmarksRoute = '/da-luu'

export interface Page<T> { items: T[]; count: number; page: number; limit: number; pages: number }
export interface Source { id: string; name: string; url: string; license: string; notice: string }
export interface Entry {
  id: string; kind: StudyKind; title: string; summary: string; reading: string; level: Level; topic: string
  hanViet: string; radical: string; strokes: number | null; partOfSpeech: string
  furigana?: string; annotations?: Record<string, string>
}
export interface Example { id: string; japanese: string; reading: string; furigana?: string; vietnamese: string; url: string; credit: string }
export interface EntryData {
  body?: string; furigana?: string; translation?: string; translationStatus?: 'REVIEWED' | 'SOURCE' | 'MACHINE' | 'PENDING'
  on?: string[]; kun?: string[]; nanori?: string[]; components?: string[]; meanings?: string[]
  otherForms?: string[]; otherReadings?: string[]; romaji?: string; formula?: string; explanation?: string; notes?: string
  conjugations?: Record<string, string>; register?: string; pitch?: string; transitivity?: string; formGroup?: string
  grade?: number; minutes?: number; audioUrl?: string; strokeUrl?: string; strokesSvg?: string[]
}
export interface StudyEntry extends Entry { data: EntryData; examples: Example[] }
export interface Detail extends StudyEntry {
  source: Source | null; links: { label: string; entry: Entry }[]
}
