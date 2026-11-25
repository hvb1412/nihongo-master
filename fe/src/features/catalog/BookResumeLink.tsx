import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { bookAnchor, type BookCheckpoint } from '../../shared/study-progress'
import { kindRoute, type KnowledgeKind } from '../../shared/types'
import { Button, Japanese } from '../../shared/ui'
import { params } from '../../shared/use-resource'

export function BookResumeLink({ kind, checkpoint, children }: { kind: KnowledgeKind; checkpoint: BookCheckpoint; children: ReactNode }) {
  const { term, level, page, id, title } = checkpoint
  const to = kindRoute[kind] + params({ q: term, level, page }) + bookAnchor(id)
  return <Button variant="outline" className="book-resume-link" asChild>
    <Link to={to}><span>{children} <Japanese text={title} /></span><ArrowRight size={16} aria-hidden="true" /></Link>
  </Button>
}
