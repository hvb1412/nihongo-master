import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowRight, Clock3, Pencil, RotateCcw, Search } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { kindLabel, kindRoute, type Detail, type Entry, type Example, type StudyEntry } from '../../shared/types'
import { Annotated, Badge, Breadcrumb, Button, EntryCard, Japanese, Resource, SaveEntryButton, Speak, usePreferences, VocabularyHanViet } from '../../shared/ui'
import { params, useResource } from '../../shared/use-resource'

export function EntryPage() {
  const { id } = useParams()
  const resource = useResource<Detail>(id ? '/catalog/entries/' + encodeURIComponent(id) : null)
  return <Resource {...resource}>{entry => <EntryContent key={entry.id} entry={entry} />}</Resource>
}

function EntryContent({ entry }: { entry: Detail }) {
  const navigate = useNavigate()
  const [selection, setSelection] = useState('')
  const furigana = usePreferences(s => s.furigana)
  const toggleFurigana = usePreferences(s => s.toggleFurigana)
  const isReading = entry.kind === 'READING'
  const isListening = entry.kind === 'LISTENING'
  const isKnowledge = !isReading && !isListening
  const back = kindRoute[entry.kind] + params({ level: entry.level })
  const senses = entry.data.meanings || []

  return <><Breadcrumb label={kindLabel[entry.kind]} href={back} />
    <article className={'surface detail-header ' + (entry.kind === 'KANJI' ? 'kanji-detail' : '')}>
      {entry.kind === 'KANJI' && <div className="kanji-hero"><Japanese text={entry.title} reading={entry.furigana} /></div>}
      <div className="detail-heading"><div className="row"><Badge tone={entry.level}>{entry.level}</Badge><Badge>{kindLabel[entry.kind]}</Badge></div>
      <div className="row detail-title"><h1>{isKnowledge && !(entry.kind === 'KANJI' && entry.hanViet) ? <Japanese text={entry.title} reading={entry.furigana ?? entry.reading} /> : entry.kind === 'KANJI' ? entry.hanViet : entry.title}</h1><VocabularyHanViet entry={entry} /></div>
      {entry.summary && senses.length < 2 && <p><Annotated text={entry.summary} entry={entry} /></p>}
      <div className="row detail-meta">{entry.topic && <small><Annotated text={entry.topic} entry={entry} /></small>}{entry.data.minutes && <small><Clock3 size={15} /> {entry.data.minutes} phút</small>}{entry.partOfSpeech && <small><Annotated text={entry.partOfSpeech} entry={entry} /></small>}</div></div>
      <div className="row detail-tools">
        {isKnowledge && <SaveEntryButton entry={entry} />}
        {isKnowledge && entry.kind !== 'GRAMMAR' && (entry.data.audioUrl ? <AudioPlayer url={entry.data.audioUrl} /> : <Speak text={entry.reading || entry.title} />)}
        <Button variant="outline" onClick={toggleFurigana} aria-pressed={furigana}>Furigana {furigana ? 'bật' : 'tắt'}</Button>
      </div>
    </article>
    {isKnowledge && <KnowledgeStudy entry={entry} layout="detail" />}
    {isReading && entry.data.body && <section className="surface panel mt-5">
      <h2>Bài đọc</h2>
      <p className="passage" onPointerUp={() => { const value = selectedJapanese(); if (value) setSelection(value) }}><Japanese text={entry.data.body} reading={entry.data.furigana} /></p>
      <form className="search-box" onSubmit={event => { event.preventDefault(); if (selection.trim()) navigate('/tu-vung' + params({ q: selection.trim() })) }}>
        <Search size={17} /><input aria-label="Từ trong bài đọc" placeholder="Chọn hoặc nhập từ cần tra" value={selection} onChange={event => setSelection(event.target.value)} maxLength={100} /><Button variant="outline" type="submit" disabled={!selection.trim()}>Tra từ</Button>
      </form>
      {entry.data.translation && <details><summary>Xem bản dịch</summary><p>{entry.data.translation}</p></details>}
    </section>}
    {isListening && <section className="surface panel mt-5"><h2>Bài nghe</h2>
      {entry.data.audioUrl ? <AudioPlayer url={entry.data.audioUrl} /> : <div className="notice">Chưa có tệp âm thanh. Bạn có thể phát bằng giọng tiếng Nhật của thiết bị nếu đã cài đặt. {entry.data.body && <Speak text={entry.data.body} />}</div>}
      {entry.data.body && <details><summary>Xem bản chép lời</summary>
        <p className="passage" onPointerUp={() => { const value = selectedJapanese(); if (value) setSelection(value) }}><Japanese text={entry.data.body} reading={entry.data.furigana} /></p>
        {entry.data.translation && <p>{entry.data.translation}</p>}
        {selection && <Button variant="outline" asChild><Link to={'/tu-vung' + params({ q: selection })}>Tra “{selection}” <ArrowRight size={16} /></Link></Button>}
      </details>}
    </section>}
    {!isKnowledge && entry.examples.length > 0 && <section className="surface panel mt-5">
      <h2>Câu ví dụ</h2><ExampleList examples={entry.examples} />
    </section>}
    {entry.links.length > 0 && <Related entries={entry.links} />}
    {entry.source && <p className="entry-credit">Nguồn {entry.source.url.startsWith('https://') ? <a href={entry.source.url}>{entry.source.name} · {entry.source.license}</a> : entry.source.name}
      {entry.data.translationStatus === 'SOURCE' && <> · Nghĩa từ Từ điển Nhật – Việt Bunchaway</>}
      {entry.data.translationStatus === 'MACHINE' && <> · Nghĩa dịch tự động</>} · <Link to="/nguon-du-lieu">Ghi công đầy đủ</Link></p>}
  </>
}

function formatKunReading(reading: string) {
  return reading.replace(/^(-?)([^.-]+)\.(.+)$/u, '$1($2)$3')
}

export function KnowledgeStudy({ entry, layout }: { entry: StudyEntry; layout: 'book' | 'panel' | 'detail' }) {
  const { data } = entry
  const framed = layout === 'detail'
  const section = framed ? 'surface panel mt-5' : 'study-block'
  const Heading = framed ? 'h2' : 'h3'
  const senses = data.meanings?.length ? data.meanings : entry.summary ? [entry.summary] : []
  const readings = [
    ['Âm Hán Việt', framed ? '' : entry.hanViet], ['Âm On', data.on?.join('・')], ['Âm Kun', data.kun?.map(formatKunReading).join('・')],
    ['Âm trong tên', data.nanori?.join('・')], ['Bộ thủ', entry.radical], ['Số nét', entry.strokes],
    ['Thành phần', data.components?.filter(item => item !== entry.title).join('・')],
    ['Cấp lớp tại Nhật', data.grade && data.grade <= 6 ? data.grade : null]
  ] as const
  const vocab = [
    ['Hiragana / Katakana', entry.reading], ['Romaji', data.romaji], ['Loại từ', entry.partOfSpeech],
    ['Nội động / tha động', data.transitivity], ['Nhóm động từ', data.formGroup], ['Sắc thái', data.register],
    ['Cao độ', data.pitch], ['Cách viết khác', data.otherForms?.join('・')], ['Cách đọc khác', data.otherReadings?.join('・')],
    ...Object.entries(data.conjugations ?? {})
  ] as const

  return <>
    {data.translationStatus === 'PENDING' && <p className="notice">Nghĩa tiếng Việt đang chờ biên tập.</p>}
    {senses.length > 1 ? <section className={section}><Heading>Nghĩa tiếng Việt</Heading>
      <ol className="dictionary-senses">{senses.map((sense, index) => <li key={index}><Annotated text={sense} entry={entry} /></li>)}</ol>
    </section> : !framed && senses[0] && <p className="study-meaning"><Annotated text={senses[0]} entry={entry} /></p>}
    {entry.kind === 'KANJI' && <div className={framed ? 'grid two mt-5' : layout === 'book' ? 'study-block book-kanji-layout' : 'study-block'}>
      <section className={framed ? 'surface panel' : undefined}><Heading>Âm đọc và cấu tạo</Heading>
        <dl className="detail-dl">{readings.map(([name, value]) => <InfoRow key={name} name={name} value={value} entry={entry} />)}</dl>
      </section>
      {(layout !== 'book' || Boolean(data.strokesSvg?.length || data.strokeUrl)) &&
        <StrokePanel paths={data.strokesSvg} url={data.strokeUrl} heading={layout === 'book' ? 'h3' : 'h2'} />}
    </div>}
    {entry.kind === 'VOCABULARY' && (vocab.some(([, value]) => value) || data.notes) && <section className={section}><Heading>Cách dùng</Heading>
      <dl className="detail-dl">{vocab.map(([name, value]) => <InfoRow key={name} name={name} value={value} entry={entry} />)}</dl>
      {data.notes && <p><Annotated text={data.notes} entry={entry} /></p>}
    </section>}
    {entry.kind === 'GRAMMAR' && (data.formula || data.explanation || data.notes) && <section className={section}>
      <Heading>Công thức và cách dùng</Heading>{data.formula && <p className="formula"><Annotated text={data.formula} entry={entry} /></p>}
      {data.explanation && <p><Annotated text={data.explanation} entry={entry} /></p>}
      {data.notes && <p className="notice"><Annotated text={data.notes} entry={entry} /></p>}
    </section>}
    {entry.examples.length > 0 && <section className={section}>
      <Heading>Câu ví dụ</Heading><ExampleList examples={entry.examples} />
    </section>}
  </>
}

function selectedJapanese() {
  const selection = window.getSelection()
  if (!selection?.rangeCount || selection.isCollapsed) return ''
  const fragment = selection.getRangeAt(0).cloneContents()
  fragment.querySelectorAll('rt, rp').forEach(element => element.remove())
  const value = fragment.textContent?.trim() || ''
  return value.length <= 100 ? value : ''
}

function InfoRow({ name, value, entry }: { name: string; value?: string | number | null; entry: Entry }) {
  return value ? <div><dt>{name}</dt><dd>{typeof value === 'string' ? <Annotated text={value} entry={entry} /> : value}</dd></div> : null
}

function ExampleList({ examples }: { examples: Example[] }) {
  return <ul className="example-list">{examples.map(item => <li key={item.id}>
    <div><Japanese text={item.japanese} reading={item.furigana ?? item.reading} />{item.vietnamese && <p>{item.vietnamese}</p>}{item.url && <a href={item.url} target="_blank" rel="noreferrer">{item.credit || 'Nguồn ví dụ'}</a>}</div>
    <Speak text={item.japanese} />
  </li>)}</ul>
}

function Related({ entries }: { entries: Detail['links'] }) {
  const types = ['KANJI', 'VOCABULARY', 'GRAMMAR'] as const
  const radicals = entries.filter(link => link.label === 'SAME_RADICAL').map(link => link.entry)
  return <section className="flow mt-5"><h2>Kiến thức liên quan</h2>
    {types.map(kind => {
      const items = entries.filter(link => link.entry.kind === kind && link.label !== 'SAME_RADICAL').map(link => link.entry)
      return items.length ? <div key={kind}><h3>{kindLabel[kind]}</h3><RelatedGroup entries={items} /></div> : null
    })}
    {radicals.length > 0 && <div><h3>Cùng bộ thủ ở cấp này</h3><RelatedGroup entries={radicals} /></div>}
  </section>
}

function RelatedGroup({ entries }: { entries: Entry[] }) {
  const [expanded, setExpanded] = useState(false)
  return <><div className="grid three">{(expanded ? entries : entries.slice(0, 6)).map(entry => <EntryCard key={entry.id} entry={entry} />)}</div>
    {entries.length > 6 && <Button className="mt-3" variant="outline" onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn' : 'Xem tất cả (' + entries.length + ')'}</Button>}</>
}

function StrokePanel({ paths, url, heading: Heading }: { paths?: string[]; url?: string; heading: 'h2' | 'h3' }) {
  const count = paths?.length ?? 0
  const [step, setStep] = useState(count)
  const [play, setPlay] = useState(false)
  const [practice, setPractice] = useState(false)
  useEffect(() => {
    if (!play) return
    const timer = window.setTimeout(() => {
      const next = Math.min(count, step + 1)
      setStep(next)
      if (next === count) setPlay(false)
    }, 440)
    return () => window.clearTimeout(timer)
  }, [play, step, count])
  return <section className="surface panel stroke-panel"><Heading>Thứ tự nét viết</Heading>
    {paths?.length ? <>
      <Button variant="outline" className="mt-3" onClick={() => { setPlay(false); setPractice(!practice) }} aria-pressed={practice}><Pencil size={16} /> {practice ? 'Xem thứ tự nét' : 'Luyện viết'}</Button>
      {practice ? <WritingPad paths={paths} /> : <>
      <svg className="stroke-diagram" viewBox="0 0 109 109" role="img" aria-label={step + ' trên ' + count + ' nét'}>
        <line x1="54.5" x2="54.5" y1="0" y2="109" /><line x1="0" x2="109" y1="54.5" y2="54.5" />
        {paths.map((path, index) => <path key={index} d={path} className={index < step ? index === step - 1 ? 'active-stroke' : 'visible-stroke' : 'hidden-stroke'} />)}
      </svg>
      <div className="row"><Button variant="outline" onClick={() => { if (play) setPlay(false); else { if (step === count) setStep(0); setPlay(true) } }}>{play ? 'Tạm dừng' : 'Phát nét viết'}</Button>
      <Button variant="ghost" onClick={() => { setPlay(false); setStep(0) }} aria-label="Đặt lại nét"><RotateCcw size={17} /></Button></div>
      <label>Nét {step}/{count}<input type="range" min={0} max={count} value={step} onChange={event => { setPlay(false); setStep(Number(event.target.value)) }} /></label>
      </>}
      <a href="https://kanjivg.tagaini.net/">KanjiVG © Ulrich Apel · CC BY-SA 3.0</a>
    </> : url ? <img src={url} alt="Sơ đồ thứ tự nét viết" /> : <p className="muted">Chưa có dữ liệu nét viết cho chữ này.</p>}
  </section>
}

function WritingPad({ paths }: { paths: string[] }) {
  const [guide, setGuide] = useState(true)
  const [lines, setLines] = useState<string[][]>([])
  const pointer = useRef<number | null>(null)
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return [(109 * (event.clientX - rect.left) / rect.width).toFixed(2), (109 * (event.clientY - rect.top) / rect.height).toFixed(2)].join(',')
  }
  return <div className="flow mt-3">
    <svg className="writing-pad" viewBox="0 0 109 109" role="img" aria-label={'Bảng luyện viết, đã vẽ ' + lines.length + ' nét'}
      onPointerDown={event => {
        if (pointer.current !== null || event.button !== 0) return
        pointer.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        const start = point(event)
        setLines(previous => [...previous, [start, start]])
      }} onPointerMove={event => {
        if (pointer.current !== event.pointerId) return
        const next = point(event)
        setLines(previous => [...previous.slice(0, -1), [...(previous.at(-1) || []), next]])
      }} onPointerUp={() => { pointer.current = null }} onPointerCancel={() => { pointer.current = null }}>
      <line x1="54.5" x2="54.5" y1="0" y2="109" /><line x1="0" x2="109" y1="54.5" y2="54.5" />
      {guide && paths.map((path, index) => <path className="hidden-stroke" key={index} d={path} />)}
      {lines.map((line, index) => <polyline key={index} points={line.join(' ')} />)}
    </svg>
    <div className="row"><label className="checkline"><input type="checkbox" checked={guide} onChange={event => setGuide(event.target.checked)} /> Nét mẫu</label>
      <Button variant="outline" disabled={!lines.length} onClick={() => setLines(previous => previous.slice(0, -1))}>Bỏ nét cuối</Button>
      <Button variant="ghost" disabled={!lines.length} onClick={() => setLines([])}>Xóa nét</Button></div>
  </div>
}

function AudioPlayer({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [failed, setFailed] = useState(false)
  const [playError, setPlayError] = useState(false)
  function restart() {
    if (!ref.current) return
    ref.current.currentTime = 0
    setPlayError(false)
    void ref.current.play().catch(() => setPlayError(true))
  }
  return <div className="audio-player">
    <audio controls preload="metadata" ref={ref} src={url} onError={() => setFailed(true)} onPlay={() => setPlayError(false)} aria-label="Phát bài nghe" />
    {failed ? <p className="error-text" role="alert">Tệp âm thanh không tải được.</p> : <div className="row">
      <label>Tốc độ<select defaultValue="1" onChange={event => { if (ref.current) ref.current.playbackRate = Number(event.target.value) }}>
        <option value="0.75">0,75×</option><option value="1">1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option>
      </select></label>
      <Button variant="outline" aria-label="Phát lại từ đầu" onClick={restart}><RotateCcw size={16} /></Button>
    </div>}
    {playError && !failed && <p className="error-text" role="alert">Không thể phát âm thanh.</p>}
  </div>
}
