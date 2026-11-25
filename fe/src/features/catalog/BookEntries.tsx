import { useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, Flag, PanelTopOpen } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { bookAnchor, bookKey, useStudyProgress } from '../../shared/study-progress'
import { type KnowledgeKind, type Page, type StudyEntry } from '../../shared/types'
import { Badge, Button, Japanese, Pagination, SaveEntryButton, VocabularyHanViet } from '../../shared/ui'
import { KnowledgeStudy } from './EntryPage'
import { EntryPopup } from './EntryPopup'

export function BookEntries({ kind, page, term, level, onPage }: {
  kind: KnowledgeKind; page: Page<StudyEntry>; term: string; level: string; onPage: (number: number) => void
}) {
  const list = useRef<HTMLOListElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const [opened, setOpened] = useState<StudyEntry | null>(null)
  const location = useLocation()
  const anchor = location.hash.startsWith('#book-') ? location.hash : ''
  const resumeVisit = anchor ? location.key : undefined
  const key = bookKey(kind, { term, level })
  const place = useStudyProgress(state => state.books[key])
  const checkpoint = useStudyProgress(state => state.checkpoints[kind])
  const markedId = checkpoint?.term === term && checkpoint.level === level && checkpoint.page === page.page ? checkpoint.id : undefined
  const toggleCheckpoint = useStudyProgress(state => state.toggleCheckpoint)
  const start = (page.page - 1) * page.limit + 1

  useLayoutEffect(() => {
    if (!list.current) return
    const rows = Array.from(list.current.children) as HTMLElement[]
    const saved = useStudyProgress.getState().books[key]
    const target = anchor ? page.items.findIndex(entry => bookAnchor(entry.id) === anchor) : -1
    const restored = target >= 0 ? target : saved?.page === page.page ? page.items.findIndex(entry => entry.id === saved.id) : -1
    let active = -1
    let frame = 0

    function remember(index: number) {
      if (active === index || !page.items[index]) return
      active = index
      useStudyProgress.getState().rememberBook(kind, { term, level, page: page.page, id: page.items[index].id, number: start + index })
    }

    function capturePosition() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        let index = 0
        for (const [rowIndex, row] of rows.entries()) {
          if (row.getBoundingClientRect().top > 130) break
          index = rowIndex
        }
        remember(index)
      })
    }

    remember(Math.max(restored, 0))
    if (target >= 0) {
      rows[target].scrollIntoView({ block: 'start' })
      rows[target].querySelector('h2')?.focus({ preventScroll: true })
    } else if (restored > 0 || (restored === 0 && page.page > 1)) {
      rows[restored].scrollIntoView({ block: 'start' })
    }
    window.addEventListener('scroll', capturePosition, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', capturePosition)
    }
  }, [anchor, key, kind, level, page.items, page.page, resumeVisit, start, term])

  function remember(entry: StudyEntry, index: number) {
    useStudyProgress.getState().rememberBook(kind, { term, level, page: page.page, id: entry.id, number: start + index })
  }

  function resume() {
    if (!place?.id) return
    Array.from(list.current?.children ?? []).find(row => (row as HTMLElement).dataset.entry === place.id)?.scrollIntoView({ block: 'start' })
  }

  return <>
    <div className="book-toolbar">
      <div className="row book-range">
        <span>Mục {start.toLocaleString('vi-VN')}–{(start + page.items.length - 1).toLocaleString('vi-VN')} / {page.count.toLocaleString('vi-VN')}</span>
        {place?.number && place.page === page.page && <button className="study-text-button" onClick={resume}>
          <BookOpen size={14} aria-hidden="true" /> Đang đọc mục {place.number.toLocaleString('vi-VN')}
        </button>}
      </div>
      <Pagination page={page.page} pages={page.pages} onChange={onPage} />
    </div>
    <ol className="surface study-book" start={start} ref={list}>
      {page.items.map((entry, index) => <li key={entry.id} className="book-entry" data-entry={entry.id}>
        <article aria-labelledby={'book-' + entry.id}>
          <header className="book-entry-head">
            <div className="book-entry-title">
              <span className="book-number">{(start + index).toLocaleString('vi-VN')}</span>
              <h2 tabIndex={-1} id={'book-' + entry.id}><Japanese text={entry.title} reading={entry.furigana ?? entry.reading} /></h2>
              <VocabularyHanViet entry={entry} />
              <Badge tone={entry.level}>{entry.level}</Badge>
            </div>
            <div className="row book-actions">
              <SaveEntryButton entry={entry} />
              <Button variant="outline" title={markedId === entry.id ? 'Bỏ đánh dấu chỗ học' : 'Đánh dấu chỗ học'} aria-pressed={markedId === entry.id} onClick={() => {
                toggleCheckpoint(kind, { term, level, page: page.page, id: entry.id, title: entry.title })
              }}>
                <Flag size={16} fill={markedId === entry.id ? 'currentColor' : 'none'} aria-hidden="true" /> Học đến đây
              </Button>
              <Button variant="ghost" aria-haspopup="dialog" onClick={event => {
                remember(entry, index)
                trigger.current = event.currentTarget
                setOpened(entry)
              }}>
                Mở mục <PanelTopOpen size={15} aria-hidden="true" />
              </Button>
            </div>
          </header>
          <KnowledgeStudy entry={entry} layout="book" />
        </article>
      </li>)}
    </ol>
    <Pagination page={page.page} pages={page.pages} onChange={onPage} />
    {opened && <EntryPopup entry={opened} onClose={() => {
      setOpened(null)
      trigger.current?.focus({ preventScroll: true })
    }} />}
  </>
}
