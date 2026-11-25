import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { knowledgeKinds, type Entry, type KnowledgeKind } from './types'

type Bookmark = Entry & { kind: KnowledgeKind }

export function isBookmarkable(entry: Entry): entry is Bookmark {
  return knowledgeKinds.some(kind => kind === entry.kind)
}

interface Bookmarks {
  entries: Bookmark[]
  toggle: (entry: Bookmark) => void
}

export const useBookmarks = create<Bookmarks>()(persist(set => ({
  entries: [],
  toggle: ({ id, kind, title, summary, reading, level, topic, hanViet, radical, strokes, partOfSpeech, furigana }) => set(state => {
    if (state.entries.some(entry => entry.id === id)) {
      return { entries: state.entries.filter(entry => entry.id !== id) }
    }
    return { entries: [{ id, kind, title, summary, reading, level, topic, hanViet, radical, strokes, partOfSpeech, furigana }, ...state.entries] }
  })
}), { name: 'nihongo-bookmarks', partialize: state => ({ entries: state.entries }) }))
