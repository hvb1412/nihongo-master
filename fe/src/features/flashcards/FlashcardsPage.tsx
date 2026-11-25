import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { flashcardsRoute, kindLabel, levels, type Detail, type Entry, type Level, type Page } from '../../shared/types'
import { Annotated, Badge, Button, Empty, Japanese, PageHeading, Resource, SaveEntryButton, Speak } from '../../shared/ui'
import { deckKey, flashKinds, useStudyProgress, type FlashKind } from '../../shared/study-progress'
import { params, prefetchCatalog, useResource } from '../../shared/use-resource'
import { KnowledgeStudy } from '../catalog/EntryPage'

type FlashcardEntry = Pick<Entry, 'id' | 'title' | 'level' | 'summary' | 'reading' | 'furigana' | 'annotations'> & { meanings: string[] }
const batchSize = 30
const number = (value: number) => value.toLocaleString('vi-VN')

export function FlashcardsPage() {
  const [search, setSearch] = useSearchParams()
  const lastDeck = useStudyProgress(state => state.lastDeck)
  const explicitDeck = search.has('kind') || search.has('level') || search.has('card')
  const kind = flashKinds.find(value => value === search.get('kind')) ?? (explicitDeck ? 'VOCABULARY' : lastDeck?.kind ?? 'VOCABULARY')
  const level = explicitDeck ? levels.find(value => value === search.get('level')) : lastDeck?.level
  const key = deckKey({ kind, level })
  const progress = useStudyProgress(state => state.decks[key])
  const selectDeck = useStudyProgress(state => state.selectDeck)
  const reveal = useStudyProgress(state => state.reveal)
  const requested = Number(search.get('card'))
  const explicitPosition = Number.isSafeInteger(requested) && requested > 0 && requested <= batchSize * 100_000
  const savedPosition = progress ? Math.min(progress.through + 1, progress.total) : 1
  const position = explicitPosition ? requested : savedPosition
  const page = Math.ceil(position / batchSize)
  const resource = useResource<Page<FlashcardEntry>>(explicitPosition ? '/catalog/flashcards/' + kind + params({ level, page, limit: batchSize }) : null)

  useEffect(() => { if (explicitPosition) selectDeck({ kind, level }) }, [explicitPosition, kind, level, selectDeck])
  const pages = resource.data?.pages
  useEffect(() => {
    if (!pages || page >= pages || page * batchSize - position > 4) return
    prefetchCatalog('/catalog/flashcards/' + kind + params({ level, page: page + 1, limit: batchSize }))
  }, [kind, level, page, pages, position])

  if (!explicitPosition) return <Navigate replace to={flashcardsRoute + params({ kind, level, card: position })} />

  function changeDeck(nextKind: FlashKind, nextLevel?: Level) {
    if (nextKind === kind && nextLevel === level) return
    setSearch(params({ kind: nextKind, level: nextLevel }))
  }

  function moveTo(card: number) {
    setSearch(params({ kind, level, card }), { replace: true })
  }

  return <>
    <PageHeading title="Flash Card" />
    <div className="surface flashcard-filters">
      <div className="chip-set" role="group" aria-label="Bộ thẻ">
        {flashKinds.map(value => <button type="button" key={value} className={'chip' + (kind === value ? ' active' : '')}
          aria-pressed={kind === value} onClick={() => changeDeck(value, level)}>{kindLabel[value]}</button>)}
      </div>
      <div className="chip-set" role="group" aria-label="Lọc cấp độ JLPT">
        <button type="button" className={'chip' + (!level ? ' active' : '')} aria-pressed={!level}
          onClick={() => changeDeck(kind)}>Tất cả cấp</button>
        {levels.map(value => <button type="button" key={value} className={'chip' + (level === value ? ' active' : '')}
          aria-pressed={level === value} onClick={() => changeDeck(kind, value)}>{value}</button>)}
      </div>
    </div>
    <Resource {...resource}>{deck => {
      if (!deck.count) return <Empty title="Bộ thẻ này chưa có nội dung" />
      const entry = deck.items[(position - 1) % batchSize]
      if (!entry) return <Empty title="Không tìm thấy thẻ ở vị trí này">
        <Button variant="outline" onClick={() => moveTo(Math.min(savedPosition, deck.count))}>Về vị trí đã lưu</Button>
      </Empty>
      const reviewed = Math.min(progress?.through ?? 0, deck.count) + (progress?.extra.filter(card => card <= deck.count).length ?? 0)
      const nextReview = (progress?.through ?? 0) + 1
      return <>
        <div className="flashcard-status">
          <span className="flashcard-position" role="status">Thẻ {number(position)} / {number(deck.count)}</span>
          <span aria-live="polite">{reviewed === deck.count ? 'Đã ôn hết bộ thẻ' : `Đã ôn ${number(reviewed)} thẻ`}</span>
          {reviewed > 0 && nextReview <= deck.count && nextReview !== position &&
            <button className="study-text-button" onClick={() => moveTo(nextReview)}>Tiếp tục từ thẻ {number(nextReview)}</button>}
        </div>
        <Flashcard key={key + '/' + entry.id} entry={entry} kind={kind} onReveal={() => reveal(key, position, deck.count)}>
          <nav className="flashcard-controls" aria-label="Chuyển thẻ">
            <Button variant="outline" disabled={position <= 1} onClick={() => moveTo(position - 1)}>
              <ArrowLeft size={17} aria-hidden="true" /> Thẻ trước
            </Button>
            <Button variant="outline" disabled={position >= deck.count} onClick={() => moveTo(position + 1)}>
              Thẻ sau <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </nav>
        </Flashcard>
      </>
    }}</Resource>
  </>
}

function Flashcard({ entry, kind, onReveal, children }: {
  entry: FlashcardEntry; kind: FlashKind; onReveal: () => void; children: ReactNode
}) {
  const [face, setFace] = useState<'new' | 'front' | 'back'>('new')
  const revealed = face === 'back'
  const detail = useResource<Detail>(face === 'new' ? null : '/catalog/entries/' + encodeURIComponent(entry.id))
  const answer = entry.meanings[0] || entry.summary || 'Chưa có nghĩa.'
  const prompt = <Japanese text={entry.title} reading={entry.furigana ?? entry.reading} />
  function flip() {
    if (!revealed) onReveal()
    setFace(revealed ? 'front' : 'back')
  }

  return <div className="flashcard-layout">
    <div className="flashcard-stage">
      <article className="flashcard" data-revealed={revealed}>
        <div className="flashcard-inner">
          <div className="surface flashcard-face flashcard-front" aria-hidden={revealed}>
            <Badge tone={entry.level}>{entry.level}</Badge>
            <h2 className={'flashcard-prompt' + (kind === 'KANJI' ? ' flashcard-kanji' : '')}>{prompt}</h2>
            <span className="flashcard-hint"><RotateCw size={15} aria-hidden="true" /> Lật thẻ</span>
          </div>
          <div className="surface flashcard-face flashcard-back" aria-hidden={!revealed}>
            <Badge tone={entry.level}>{entry.level}</Badge>
            <h2 className="flashcard-prompt">{prompt}</h2>
            <p className="flashcard-meaning"><Annotated text={answer} entry={entry} /></p>
            <span className="flashcard-hint"><RotateCw size={15} aria-hidden="true" /> Lật lại</span>
          </div>
        </div>
        <button type="button" className="flashcard-hit" aria-label={revealed ? 'Lật lại mặt trước' : 'Lật thẻ'}
          aria-expanded={revealed} aria-controls="flashcard-detail" onClick={flip} />
      </article>
      {children}
    </div>
    <aside id="flashcard-detail" className="surface panel flashcard-detail" aria-labelledby="flashcard-detail-heading" data-expanded={revealed}>
      <div className="between">
        <h2 id="flashcard-detail-heading">Chi tiết thẻ</h2>
        {revealed && detail.data && <div className="row">
          <SaveEntryButton entry={detail.data} iconOnly />
          <Speak text={detail.data.reading || detail.data.title} />
        </div>}
      </div>
      {revealed ? <Resource {...detail}>{entry => <KnowledgeStudy entry={entry} layout="panel" />}</Resource>
        : <p className="muted">Lật thẻ để xem cách đọc, cách dùng và câu ví dụ.</p>}
    </aside>
  </div>
}
