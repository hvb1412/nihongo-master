import { useRef, useState } from 'react'
import { useBookmarks } from '../../shared/bookmarks'
import { kindLabel, type Entry, type KnowledgeKind } from '../../shared/types'
import { Empty, EntryCard, PageHeading } from '../../shared/ui'
import { EntryPopup } from './EntryPopup'

const filters = ['', 'VOCABULARY', 'GRAMMAR', 'KANJI'] as const

export function BookmarksPage() {
  const entries = useBookmarks(state => state.entries)
  const [filter, setFilter] = useState<KnowledgeKind | ''>('')
  const [opened, setOpened] = useState<Entry | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const allFilter = useRef<HTMLButtonElement>(null)
  const visible = filter ? entries.filter(entry => entry.kind === filter) : entries

  function close() {
    setOpened(null)
    const target = trigger.current?.isConnected ? trigger.current : allFilter.current
    target?.focus({ preventScroll: true })
  }

  return <>
    <PageHeading title="Đã lưu" />
    <div className="chip-set bookmarks-filters" role="group" aria-label="Lọc mục đã lưu">
      {filters.map(kind => <button key={kind} type="button" ref={kind ? undefined : allFilter}
        className={'chip' + (filter === kind ? ' active' : '')} aria-pressed={filter === kind} onClick={() => setFilter(kind)}>
        {kind ? kindLabel[kind] : 'Tất cả'}
      </button>)}
    </div>
    {visible.length ? <div className="catalog-grid">
      {visible.map(entry => <EntryCard key={entry.id} entry={entry} onOpen={event => {
        trigger.current = event.currentTarget
        setOpened(entry)
      }} />)}
    </div> : <Empty title={entries.length ? 'Chưa lưu mục nào trong nhóm này' : 'Chưa có mục đã lưu'}>
      {!entries.length && <p>Bấm Lưu ở mục bạn muốn xem lại.</p>}
    </Empty>}
    {opened && <EntryPopup entry={opened} onClose={close} />}
  </>
}
