import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Layers, Search } from 'lucide-react'
import { flashcardsRoute, kindLabel, kindRoute, knowledgeKinds, levels, type Entry, type KnowledgeKind, type StudyKind, type Page, type StudyEntry } from '../../shared/types'
import { Button, Empty, EntryCard, PageHeading, Pagination, Resource } from '../../shared/ui'
import { params, prefetchCatalog, useResource } from '../../shared/use-resource'
import { bookKey, useStudyProgress } from '../../shared/study-progress'
import { BookEntries } from './BookEntries'
import { BookResumeLink } from './BookResumeLink'

const descriptions: Record<StudyKind, string> = {
  KANJI: 'Tra chữ Hán, cách đọc, nghĩa và thứ tự nét viết.',
  VOCABULARY: 'Tra từ theo cách viết, cách đọc hoặc nghĩa tiếng Việt.',
  GRAMMAR: 'Xem công thức và cách dùng qua ví dụ.',
  READING: 'Đọc theo cấp độ, tra từ trong bài và đối chiếu bản dịch.',
  LISTENING: 'Nghe theo cấp độ và đối chiếu bản chép lời.'
}
const bookPageSize = 8

export function LookupForm({ label, initialValue = '', onSearch, compact = false }: {
  label: string; initialValue?: string; onSearch?: (term: string) => void; compact?: boolean
}) {
  const [draft, setDraft] = useState(initialValue)
  const navigate = useNavigate()
  function submit(event: FormEvent) {
    event.preventDefault()
    const term = draft.trim()
    if (onSearch) onSearch(term)
    else if (term) navigate('/tra-cuu' + params({ q: term }))
  }
  return <form className={'search-box' + (compact ? ' search-compact' : '')} onSubmit={submit} role="search" aria-label={label}>
    <Search size={19} aria-hidden="true" />
    <input aria-label={label} placeholder={compact ? 'Tra từ điển…' : 'Ví dụ 勉強, べんきょう hoặc học tập'} value={draft} maxLength={100} onChange={event => setDraft(event.target.value)} />
    <Button type="submit" aria-label={compact ? 'Tra cứu' : undefined}>{compact ? <ArrowRight size={17} /> : 'Tìm'}</Button>
  </form>
}

export function CatalogPage({ kind }: { kind: StudyKind }) {
  const [search, setSearch] = useSearchParams()
  const bookKind = knowledgeKinds.find(value => value === kind)
  const checkpoint = useStudyProgress(state => bookKind ? state.checkpoints[bookKind] : undefined)
  const lastBook = useStudyProgress(state => bookKind ? state.books[state.lastBooks[bookKind] ?? ''] : undefined)
  const implicit = bookKind && !search.has('q') && !search.has('level') && !search.has('page')
  const term = implicit ? lastBook?.term ?? '' : search.get('q')?.trim().slice(0, 100) ?? ''
  const level = implicit ? lastBook?.level ?? '' : search.get('level') ?? ''
  const savedPage = useStudyProgress(state => bookKind ? state.books[bookKey(bookKind, { level, term })]?.page : undefined)
  const pageNumber = search.get('page') ?? savedPage ?? 1
  const filters = params({ q: term, level, page: pageNumber })
  const resource = useResource<Page<Entry>>(bookKind ? null : '/catalog/' + kind + filters)
  const book = useResource<Page<StudyEntry>>(bookKind ? '/catalog/book/' + bookKind + params({ q: term, level, page: pageNumber, limit: bookPageSize }) : null)
  const compound = kind === 'KANJI' && /\p{Script=Han}/u.test(term) && [...term].length > 1 ? term : ''
  const matchingWords = useResource<Page<Entry>>(compound ? '/catalog/VOCABULARY' + params({ q: compound, level, limit: 3 }) : null)
  const exactWords = matchingWords.data?.items.filter(entry => entry.title.normalize('NFKC') === compound.normalize('NFKC')) || []
  const showFlashcards = kind === 'KANJI' || kind === 'VOCABULARY'

  const loaded = book.data
  useEffect(() => {
    if (!bookKind || !loaded || loaded.page >= loaded.pages) return
    prefetchCatalog('/catalog/book/' + bookKind + params({ q: term, level, page: loaded.page + 1, limit: bookPageSize }))
  }, [bookKind, level, loaded, term])

  function changeFilters(q: string, nextLevel: string) {
    if (q === term && nextLevel === level) return
    setSearch(q || nextLevel ? params({ q, level: nextLevel }) : bookKind ? { level: '' } : {})
    window.scrollTo(0, 0)
  }

  function changePage(page: number) {
    setSearch(params({ q: term, level, page }))
    window.scrollTo(0, 0)
  }

  return <>
    <PageHeading title={kindLabel[kind]} description={descriptions[kind]}>
      {(checkpoint || showFlashcards) && <div className="row">
        {bookKind && checkpoint && <BookResumeLink kind={bookKind} checkpoint={checkpoint}>Học tiếp</BookResumeLink>}
        {showFlashcards && <Button variant="outline" asChild>
          <Link to={flashcardsRoute + params({ kind, level })}><Layers size={17} aria-hidden="true" /> Ôn bằng Flash Card</Link>
        </Button>}
      </div>}
    </PageHeading>
    <div className="surface catalog-filters">
      <LookupForm key={term} label="Tìm trong thư viện" initialValue={term} onSearch={q => changeFilters(q, level)} />
      <div className="chip-set filter-row" aria-label="Lọc cấp độ">
        {['', ...levels].map(value => <button type="button" key={value} className={'chip' + (level === value ? ' active' : '')}
          aria-pressed={level === value} onClick={() => changeFilters(term, value)}>{value || 'Tất cả cấp'}</button>)}
      </div>
    </div>
    {exactWords.length > 0 && <SearchGroup kind="VOCABULARY" q={compound} items={exactWords} />}
    {bookKind ? <Resource {...book}>{page => page.items.length
      ? <BookEntries key={filters} kind={bookKind} page={page} term={term} level={level} onPage={changePage} />
      : <Empty title="Không tìm thấy nội dung">
        {page.count > 0 ? <Button variant="outline" onClick={() => changePage(1)}>Về trang đầu</Button> :
          (term || level) && <Button variant="outline" onClick={() => changeFilters('', '')}>Xóa bộ lọc</Button>}
      </Empty>}</Resource> : <Resource {...resource}>{page => <>
      <div className="list-label"><span>{page.count.toLocaleString('vi-VN')} mục</span>{term && <span>Kết quả cho “{term}”</span>}</div>
      {page.items.length
        ? <div className="catalog-grid">{page.items.map(entry => <EntryCard key={entry.id} entry={entry} />)}</div>
        : <Empty title="Không tìm thấy nội dung">{(term || level) && <Button variant="outline" onClick={() => changeFilters('', '')}>Xóa bộ lọc</Button>}</Empty>}
      <Pagination page={page.page} pages={page.pages} onChange={changePage} />
    </>}</Resource>}
  </>
}

export function GlobalSearch() {
  const [search, setSearch] = useSearchParams()
  const q = (search.get('q') || '').trim().slice(0, 100)
  const [kind, setKind] = useState<KnowledgeKind | ''>('')
  const results = useResource<Record<KnowledgeKind, Page<Entry>>>(q ? '/catalog/search' + params({ q }) : null)
  const order: KnowledgeKind[] = /^\p{Script=Han}$/u.test(q) ? [...knowledgeKinds] : ['VOCABULARY', 'KANJI', 'GRAMMAR']
  return <>
    <PageHeading title="Tra cứu Nhật – Việt" />
    <LookupForm label="Từ khóa tra cứu" initialValue={q} onSearch={term => setSearch(params({ q: term }))} />
    {q && <Resource {...results}>{groups => {
      const visible = (kind ? [kind] : order).filter(group => groups[group].items.length)
      return <>
        <div className="chip-set mt-5" aria-label="Loại kết quả">
          {(['', ...order] as const).map(group => <button key={group} type="button" className={'chip' + (kind === group ? ' active' : '')}
            aria-pressed={kind === group} onClick={() => setKind(group)}>
            {group ? kindLabel[group] + ' (' + groups[group].count.toLocaleString('vi-VN') + ')' : 'Tất cả'}
          </button>)}
        </div>
        {visible.length ? visible.map(group => <SearchGroup key={group} q={q} kind={group} items={groups[group].items} />) :
          <Empty title={'Không tìm thấy “' + q + '”' + (kind ? ' trong ' + kindLabel[kind].toLowerCase() : '')} />}
      </>
    }}</Resource>}
  </>
}

function SearchGroup({ q, kind, items }: { q: string; kind: KnowledgeKind; items: Entry[] }) {
  return <section className="flow mt-5">
    <div className="section-head"><h2>{kindLabel[kind]}</h2><Link to={kindRoute[kind] + params({ q })}>Xem tất cả <ArrowRight size={16} /></Link></div>
    <div className="grid three">{items.map(entry => <EntryCard key={entry.id} entry={entry} />)}</div>
  </section>
}
