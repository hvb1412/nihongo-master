import { useEffect, useState } from 'react'
import { AudioLines, BookOpen, Bookmark, House, Languages, Layers, LibraryBig, Menu, Workflow, X } from 'lucide-react'
import { Link, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Brand, Button, Empty } from '../shared/ui'
import { bookmarksRoute, flashcardsRoute, kindLabel, kindRoute, knowledgeKinds } from '../shared/types'
import { useStudyProgress } from '../shared/study-progress'
import { BookmarksPage } from '../features/catalog/BookmarksPage'
import { BookResumeLink } from '../features/catalog/BookResumeLink'
import { CatalogPage, GlobalSearch, LookupForm } from '../features/catalog/CatalogPages'
import { EntryPage } from '../features/catalog/EntryPage'
import { FlashcardsPage } from '../features/flashcards/FlashcardsPage'
import { Sources } from '../features/public/Sources'

const sections = [
  ['VOCABULARY', LibraryBig, 'Tra nghĩa, cách đọc và câu ví dụ.'],
  ['GRAMMAR', Workflow, 'Xem công thức và cách dùng trong câu.'],
  ['KANJI', Languages, 'Học âm On, âm Kun và thứ tự nét viết.'],
  ['READING', BookOpen, 'Đọc theo cấp độ, tra từ ngay trong bài.'],
  ['LISTENING', AudioLines, 'Nghe tiếng Nhật và đối chiếu bản chép lời.']
] as const

const studyLinks = [
  ...sections.map(([kind, icon, description]) => ({ to: kindRoute[kind], label: kindLabel[kind], icon, description })),
  { to: flashcardsRoute, label: 'Flash Card', icon: Layers, description: 'Lật thẻ để ôn cách đọc và nghĩa của từ vựng và Kanji.' }
]

function Layout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const showLookup = pathname !== '/' && pathname !== '/tra-cuu'
  return <div className="site">
    <a className="skip-link" href="#main">Đến nội dung</a>
    <aside className="site-sidebar">
      <div className="sidebar-header">
        <Brand onClick={() => setMenuOpen(false)} />
        <Button variant="ghost" className="sidebar-toggle" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen} aria-controls="study-nav" onClick={() => setMenuOpen(open => !open)}>
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </Button>
      </div>
      <nav className="study-nav" id="study-nav" aria-label="Khu vực học tập" data-open={menuOpen}>
        <NavLink to="/" end onClick={() => setMenuOpen(false)}><House size={18} aria-hidden="true" />Trang chủ</NavLink>
        {studyLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
          <Icon size={18} aria-hidden="true" />{label}
        </NavLink>)}
        <NavLink to={bookmarksRoute} onClick={() => setMenuOpen(false)}><Bookmark size={18} aria-hidden="true" />Đã lưu</NavLink>
      </nav>
    </aside>
    <div className="site-content">
      {showLookup && <header className="site-header"><div className="site-bar site-width">
        <LookupForm label="Tra cứu toàn bộ từ điển" compact />
      </div></header>}
      <main id="main" className="site-main site-width" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer"><div className="site-width"><Link to="/nguon-du-lieu">Nguồn dữ liệu</Link></div></footer>
    </div>
  </div>
}

function Home() {
  const checkpoints = useStudyProgress(state => state.checkpoints)
  const resumeKinds = knowledgeKinds.filter(kind => checkpoints[kind])
  return <>
    <section className="home-intro">
      <h1>Học tiếng Nhật</h1>
      <p>Từ điển Nhật–Việt và bài đọc, bài nghe theo cấp JLPT N5–N1.</p>
      <LookupForm label="Tra cứu toàn bộ từ điển" />
    </section>
    {resumeKinds.length > 0 && <section className="flow book-resume-section" aria-labelledby="home-resume">
      <h2 id="home-resume">Học tiếp</h2>
      <div className="row">{resumeKinds.map(kind => {
        const checkpoint = checkpoints[kind]
        return checkpoint && <BookResumeLink key={kind} kind={kind} checkpoint={checkpoint}>{kindLabel[kind]}</BookResumeLink>
      })}</div>
    </section>}
    <nav className="study-sections" aria-label="Chọn nội dung học">
      {studyLinks.map(({ to, label, icon: Icon, description }) => <Link to={to} key={to} className="surface study-section">
        <span className="study-icon"><Icon size={21} aria-hidden="true" /></span>
        <strong>{label}</strong><span className="muted">{description}</span>
      </Link>)}
    </nav>
  </>
}

export default function App() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      {sections.map(([kind]) => <Route key={kind} path={kindRoute[kind]} element={<CatalogPage key={kind} kind={kind} />} />)}
      <Route path={flashcardsRoute} element={<FlashcardsPage />} />
      <Route path={bookmarksRoute} element={<BookmarksPage />} />
      <Route path="/tra-cuu" element={<GlobalSearch key={location.search} />} />
      <Route path="/noi-dung/:id" element={<EntryPage />} />
      <Route path="/nguon-du-lieu" element={<Sources />} />
      <Route path="*" element={<Empty title="Không tìm thấy trang"><Button asChild><Link to="/">Về trang chủ</Link></Button></Empty>} />
    </Route>
  </Routes>
}
