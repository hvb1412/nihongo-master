import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KnowledgeKind, Level } from './types'

export const flashKinds = ['VOCABULARY', 'KANJI'] as const
export type FlashKind = typeof flashKinds[number]
type Deck = { kind: FlashKind; level?: Level }
export const deckKey = ({ kind, level }: Deck) => kind + '/' + (level ?? 'all')

interface DeckProgress { through: number; extra: number[]; total: number }
export interface BookView { term: string; level: string; page: number; id?: string; number?: number }
export interface BookCheckpoint extends Pick<BookView, 'term' | 'level' | 'page'> { id: string; title: string }
export const bookKey = (kind: KnowledgeKind, view: Pick<BookView, 'level' | 'term'>) => JSON.stringify([kind, view.level, view.term])
export const bookAnchor = (id: string) => '#book-' + encodeURIComponent(id)

interface StudyProgress {
  decks: Record<string, DeckProgress>
  lastDeck?: Deck
  books: Record<string, BookView>
  lastBooks: Partial<Record<KnowledgeKind, string>>
  checkpoints: Partial<Record<KnowledgeKind, BookCheckpoint>>
  selectDeck: (deck: Deck) => void
  reveal: (key: string, position: number, total: number) => void
  rememberBook: (kind: KnowledgeKind, view: BookView) => void
  toggleCheckpoint: (kind: KnowledgeKind, view: BookCheckpoint) => void
}

export const useStudyProgress = create<StudyProgress>()(persist(set => ({
  decks: {}, books: {}, lastBooks: {}, checkpoints: {},
  selectDeck: deck => set(state => state.lastDeck && deckKey(state.lastDeck) === deckKey(deck) ? state : { lastDeck: deck }),
  reveal: (key, position, total) => set(state => {
    const saved = state.decks[key]
    let through = Math.min(saved?.through ?? 0, total)
    const extra = (saved?.extra ?? []).filter(number => number <= total)
    if (position <= through || extra.includes(position)) return state
    if (position === through + 1) {
      through = position
      while (extra[0] === through + 1) through = extra.shift()!
    } else {
      extra.push(position)
      extra.sort((a, b) => a - b)
    }
    return { decks: { ...state.decks, [key]: { through, extra, total } } }
  }),
  rememberBook: (kind, view) => set(state => {
    const key = bookKey(kind, view)
    const saved = state.books[key]
    if (state.lastBooks[kind] === key && saved?.page === view.page && saved?.id === view.id) return state
    return { books: { ...state.books, [key]: view }, lastBooks: { ...state.lastBooks, [kind]: key } }
  }),
  toggleCheckpoint: (kind, view) => set(state => {
    const saved = state.checkpoints[kind]
    const same = saved?.id === view.id && saved.term === view.term && saved.level === view.level && saved.page === view.page
    return { checkpoints: { ...state.checkpoints, [kind]: same ? undefined : view } }
  })
}), {
  name: 'nihongo-study-progress',
  partialize: ({ decks, lastDeck, books, lastBooks, checkpoints }) => ({ decks, lastDeck, books, lastBooks, checkpoints })
}))
