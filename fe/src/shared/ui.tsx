import { Slot } from '@radix-ui/react-slot'
import { ArrowLeft, ArrowRight, Bookmark, CircleAlert, LibraryBig, Volume2 } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Link } from 'react-router-dom'
import { useEffect, useState, type ButtonHTMLAttributes, type MouseEventHandler, type ReactNode, type Ref } from 'react'
import { isBookmarkable, useBookmarks } from './bookmarks'
import { kindLabel, type Entry } from './types'

const classes = (...names: (string | undefined)[]) => names.filter(Boolean).join(' ')
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: 'primary' | 'outline' | 'ghost'; ref?: Ref<HTMLButtonElement> }
export function Button({ asChild, variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={classes('button', 'button-' + variant, className)} {...(asChild ? {} : { type })} {...props} />
}

export function Brand({ onClick }: { onClick?: () => void }) {
  return <Link className="brand" to="/" onClick={onClick}><img src="/icon.svg" alt="" width="36" height="36" /><span>Nihongo <strong>Master</strong></span></Link>
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={'badge tone-' + tone.toLowerCase()}>{children}</span>
}

export function Empty({ title = 'Chưa có dữ liệu', children }: { title?: string; children?: ReactNode }) {
  return <div className="empty"><LibraryBig size={25} aria-hidden="true" /><h3>{title}</h3>{children}</div>
}

export function Resource<T>({ data, error, reload, children }: { data?: T; error?: string; reload?: () => void; children: (value: T) => ReactNode }) {
  if (error) return <div className="empty" role="alert"><CircleAlert size={24} /><h3>{error}</h3>{reload && <Button variant="outline" onClick={reload}>Thử lại</Button>}</div>
  if (data === undefined) return <div className="skeletons" role="status" aria-label="Đang tải"><i /><i /><i /></div>
  return children(data)
}

export function PageHeading({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <header className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</header>
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1 && page <= 1) return null
  return <nav aria-label="Phân trang" className="pagination">
    <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước"><ArrowLeft size={16} /></Button>
    <span>Trang {page} / {Math.max(1, pages)}</span>
    <Button variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Trang sau"><ArrowRight size={16} /></Button>
  </nav>
}

interface Preferences { furigana: boolean; toggleFurigana: () => void }
export const usePreferences = create<Preferences>()(persist(set => ({
  furigana: true, toggleFurigana: () => set(state => ({ furigana: !state.furigana }))
}), { name: 'nihongo-preferences', partialize: state => ({ furigana: state.furigana }) }))

export function Japanese({ text, reading, className, mixed = false }: { text: string; reading?: string; className?: string; mixed?: boolean }) {
  const furigana = usePreferences(s => s.furigana)
  const value = reading && reading.includes('{') ? reading : text
  const parts = value.split(/(\{[^{}|]+\|[^{}|]+\})/g)
  return <span lang={mixed ? undefined : 'ja'} className={classes(mixed ? undefined : 'japanese', className)}>{parts.map((part, index) => {
    const ruby = part.match(/^\{([^|]+)\|([^}]+)\}$/)
    if (ruby) return furigana ? <ruby key={index} lang={mixed ? 'ja' : undefined}>{ruby[1]}<rt>{ruby[2]}</rt></ruby> : ruby[1]
    if (parts.length === 1 && reading && reading !== text && !reading.includes('{') && /\p{Script=Han}/u.test(text) && furigana) return <ruby key={index}>{text}<rt>{reading}</rt></ruby>
    return part
  })}</span>
}

export function Annotated({ text, entry }: { text: string; entry: Pick<Entry, 'annotations'> }) {
  const reading = entry.annotations?.[text]
  return reading && reading !== text ? <Japanese text={text} reading={reading} mixed /> : text
}

export function Speak({ text }: { text: string }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice>()
  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    const check = () => setVoice(synth.getVoices().find(item => item.lang.toLowerCase().startsWith('ja')))
    check()
    synth.addEventListener('voiceschanged', check)
    return () => synth.removeEventListener('voiceschanged', check)
  }, [])
  if (!voice) return null
  return <Button variant="outline" aria-label="Phát âm tiếng Nhật" onClick={() => {
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    utterance.lang = 'ja-JP'
    synth.speak(utterance)
  }}><Volume2 size={17} /></Button>
}

export const entryHref = (id: string) => '/noi-dung/' + encodeURIComponent(id)
export function VocabularyHanViet({ entry }: { entry: Pick<Entry, 'kind' | 'hanViet'> }) {
  return entry.kind === 'VOCABULARY' && entry.hanViet
    ? <span className="vocab-han-viet" title="Âm Hán Việt theo chữ Kanji">{entry.hanViet}</span> : null
}

export function SaveEntryButton({ entry, iconOnly = false, className }: { entry: Entry; iconOnly?: boolean; className?: string }) {
  const saved = useBookmarks(state => state.entries.some(item => item.id === entry.id))
  const toggle = useBookmarks(state => state.toggle)
  if (!isBookmarkable(entry)) return null
  return <Button variant="ghost" className={classes('save-entry', iconOnly ? 'save-entry-icon' : undefined, className)}
    aria-label="Lưu để xem sau" aria-pressed={saved} title={saved ? 'Bỏ lưu' : 'Lưu để xem sau'} onClick={() => toggle(entry)}>
    <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
    {!iconOnly && (saved ? 'Đã lưu' : 'Lưu')}
  </Button>
}

export function EntryCard({ entry, onOpen }: { entry: Entry; onOpen?: MouseEventHandler<HTMLButtonElement> }) {
  const bookmarkable = isBookmarkable(entry)
  const content = <>
    <span className="entry-card-level"><Badge tone={entry.level}>{entry.level}</Badge></span>
    <span className="row"><strong>{bookmarkable
      ? <Japanese text={entry.title} reading={entry.furigana ?? entry.reading} /> : entry.title}</strong><VocabularyHanViet entry={entry} /></span>
    {(entry.hanViet || entry.summary) && <span className="entry-card-summary">{entry.kind === 'KANJI' && entry.hanViet ? entry.hanViet + ' · ' : ''}<Annotated text={entry.summary} entry={entry} /></span>}
    <span className="entry-footer"><span><Annotated text={entry.strokes ? entry.strokes + ' nét' : entry.topic || kindLabel[entry.kind]} entry={entry} /></span><ArrowRight size={16} aria-hidden="true" /></span>
  </>
  return <article className={'entry-card surface kind-' + entry.kind.toLowerCase()}>
    {onOpen ? <button type="button" className="entry-card-open" aria-haspopup="dialog" onClick={onOpen}>{content}</button>
      : <Link to={entryHref(entry.id)} className="entry-card-open">{content}</Link>}
    {bookmarkable && <SaveEntryButton entry={entry} iconOnly className="entry-card-save" />}
  </article>
}

export function Breadcrumb({ label, href }: { label: string; href: string }) {
  return <nav className="breadcrumb" aria-label="Đường dẫn"><Link to={href}><ArrowLeft size={15} />{label}</Link></nav>
}
