import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, X } from 'lucide-react'
import { kindLabel, type Detail, type Entry, type StudyEntry } from '../../shared/types'
import { Badge, Button, Japanese, SaveEntryButton, Speak, VocabularyHanViet } from '../../shared/ui'
import { useResource } from '../../shared/use-resource'
import { KnowledgeStudy } from './EntryPage'

export function EntryPopup({ entry, onClose }: { entry: Entry | StudyEntry; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const [trail, setTrail] = useState<Entry[]>([entry])
  const current = trail[trail.length - 1]
  const currentId = current.id
  const { data: detail, error, reload } = useResource<Detail>('/catalog/entries/' + encodeURIComponent(currentId))

  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  useLayoutEffect(() => {
    if (body.current) body.current.scrollTop = 0
    title.current?.focus({ preventScroll: true })
  }, [currentId])

  const preview = detail ?? (currentId === entry.id && 'data' in entry ? entry : undefined)
  const heading = detail ?? current
  const links = detail?.links.filter(({ entry }) => ['KANJI', 'VOCABULARY', 'GRAMMAR'].includes(entry.kind)) ?? []
  const kanji = links.filter(({ label }) => label === 'KANJI' || label === 'SAME_RADICAL')
  const spellingOrder = [...heading.title]
  const visible = heading.kind === 'VOCABULARY'
    ? spellingOrder.filter((char, index) => spellingOrder.indexOf(char) === index).flatMap(char => kanji.filter(link => link.entry.title === char))
    : kanji
  const other = links.filter(link => !visible.includes(link))

  function openRelated(item: Entry) {
    const prior = trail.findIndex(step => step.id === item.id)
    setTrail(prior >= 0 ? trail.slice(0, prior + 1) : [...trail, item])
  }

  function close() {
    dialog.current?.close()
    onClose()
  }

  return <dialog ref={dialog} className="entry-popup surface" aria-labelledby="entry-popup-title" onCancel={event => {
    event.preventDefault()
    close()
  }} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className="entry-popup-shell">
      <header className="entry-popup-header">
        <div className="row entry-popup-labels">
          {trail.length > 1 && <Button variant="ghost" onClick={() => setTrail(trail.slice(0, -1))}>
            <ArrowLeft size={17} aria-hidden="true" /> Quay lại
          </Button>}
          <span className="muted">{kindLabel[heading.kind]}</span>
          <Badge tone={heading.level}>{heading.level}</Badge>
        </div>
        <div className="row entry-popup-actions">
          <SaveEntryButton entry={heading} />
          <Button variant="ghost" onClick={close} aria-label="Đóng chi tiết"><X size={22} aria-hidden="true" /></Button>
        </div>
      </header>
      <div ref={body} className="entry-popup-body">
        <div className="row entry-popup-title">
          <h2 ref={title} tabIndex={-1} id="entry-popup-title"><Japanese text={heading.title} reading={heading.furigana ?? heading.reading} /></h2>
          <VocabularyHanViet entry={heading} />
          {heading.kind !== 'GRAMMAR' && <Speak text={heading.reading || heading.title} />}
        </div>
        {visible.length > 0 && <RelatedButtons key={currentId + '-kanji'} title={heading.kind === 'VOCABULARY' ? 'Kanji trong từ' : 'Kanji liên quan'} links={visible} onOpen={openRelated} />}
        {preview && <KnowledgeStudy key={currentId} entry={preview} layout="panel" />}
        {other.length > 0 && <RelatedButtons key={currentId + '-related'} title="Mục liên quan" links={other} onOpen={openRelated} />}
        {error ? <div className="notice" role="alert">{error} <Button variant="outline" onClick={reload}>Thử lại</Button></div>
          : !detail && <p className="muted" role="status">Đang tải thông tin chi tiết…</p>}
      </div>
    </div>
  </dialog>
}

function RelatedButtons({ title, links, onOpen }: { title: string; links: Detail['links']; onOpen: (entry: Entry) => void }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? links : links.slice(0, 8)
  return <section className="study-block">
    <h3>{title}</h3>
    <div className="row popup-related">
      {shown.map(({ entry }) => <Button key={entry.id} variant="outline" onClick={() => onOpen(entry)}>
        <Japanese text={entry.title} reading={entry.furigana ?? entry.reading} />
        {entry.hanViet && <span className="muted">{entry.hanViet}</span>}
        <ChevronRight size={15} aria-hidden="true" />
      </Button>)}
    </div>
    {links.length > 8 && <Button variant="ghost" onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn' : 'Xem thêm'}</Button>}
  </section>
}
