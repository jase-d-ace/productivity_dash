import { useCallback, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchNote, publishPage } from '../api'
import type { Note } from '../types'
import PomodoroTimer from './PomodoroTimer'

const widgetStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #ddd8e8',
  borderRadius: 14,
  boxShadow: '0 2px 8px rgba(155, 142, 196, 0.08)',
  padding: '1.25rem',
}

const widgetHeaderStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
  background: 'linear-gradient(135deg, #f0faff, #f8f4ff)',
  margin: '-1.25rem -1.25rem 1rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '14px 14px 0 0',
  color: '#6b6189',
}

function renderPreview(content: string) {
  if (!content.trim()) return null
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  function inlineMarkdown(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`/g
    let last = 0
    let match: RegExpExecArray | null
    let key = 0
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index))
      if (match[1] != null) parts.push(<a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#9b8ec4' }}>{match[1]}</a>)
      else if (match[3] != null) parts.push(<strong key={key++}>{match[3]}</strong>)
      else if (match[4] != null) parts.push(<em key={key++}>{match[4]}</em>)
      else if (match[5] != null) parts.push(<s key={key++}>{match[5]}</s>)
      else if (match[6] != null) parts.push(<code key={key++} style={{ background: '#f0edff', padding: '1px 4px', borderRadius: 3, fontSize: 13 }}>{match[6]}</code>)
      last = pattern.lastIndex
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) { elements.push(<div key={i} style={{ height: 8 }} />); continue }
    if (line === '---' || line === '***' || line === '___') { elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #e8e4f0', margin: '8px 0' }} />); continue }
    if (line.startsWith('### ')) { elements.push(<h4 key={i} style={{ margin: '8px 0 4px', color: '#3a3650', fontSize: 15 }}>{inlineMarkdown(line.slice(4))}</h4>); continue }
    if (line.startsWith('## ')) { elements.push(<h3 key={i} style={{ margin: '8px 0 4px', color: '#3a3650', fontSize: 17 }}>{inlineMarkdown(line.slice(3))}</h3>); continue }
    if (line.startsWith('# ')) { elements.push(<h2 key={i} style={{ margin: '8px 0 4px', color: '#3a3650', fontSize: 20 }}>{inlineMarkdown(line.slice(2))}</h2>); continue }
    if (line.startsWith('> ')) { elements.push(<blockquote key={i} style={{ margin: '4px 0', paddingLeft: 12, borderLeft: '3px solid #d4d0de', color: '#6b6189' }}>{inlineMarkdown(line.slice(2))}</blockquote>); continue }
    if (/^[-*] \[x\] /.test(line)) { elements.push(<div key={i} style={{ padding: '2px 0', color: '#8b85a0' }}>&#9745; <s>{inlineMarkdown(line.slice(6))}</s></div>); continue }
    if (/^[-*] \[ \] /.test(line)) { elements.push(<div key={i} style={{ padding: '2px 0' }}>&#9744; {inlineMarkdown(line.slice(6))}</div>); continue }
    if (line.startsWith('- ') || line.startsWith('* ')) { elements.push(<div key={i} style={{ padding: '2px 0 2px 8px' }}>&bull; {inlineMarkdown(line.slice(2))}</div>); continue }
    if (/^\d+\.\s/.test(line)) { const num = line.match(/^(\d+)\.\s/)![1]; elements.push(<div key={i} style={{ padding: '2px 0 2px 8px' }}>{num}. {inlineMarkdown(line.replace(/^\d+\.\s/, ''))}</div>); continue }
    elements.push(<p key={i} style={{ margin: '4px 0' }}>{inlineMarkdown(line)}</p>)
  }
  return elements
}

export default function CreatePage() {
  const { noteId } = useParams<{ noteId: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { data: note, isLoading, error } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId!),
    enabled: !!noteId,
  })

  const mutation = useMutation({
    mutationFn: () => publishPage(noteId!, { title: note!.title, content }),
    onSuccess: () => navigate('/'),
  })

  const fakeNote: Note | null = note ? { ...note } : null

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current
    if (!ta) return

    if (e.key === 'Enter') {
      const { selectionStart, value } = ta
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
      const currentLine = value.slice(lineStart, selectionStart)

      // Checklist continuation
      const checkMatch = currentLine.match(/^(\s*)([-*]) \[[ x]\] $/)
      if (checkMatch) {
        // Empty checklist item — remove it
        e.preventDefault()
        const newVal = value.slice(0, lineStart) + value.slice(selectionStart)
        setContent(newVal)
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart })
        return
      }
      const checkCont = currentLine.match(/^(\s*)([-*]) \[[ x]\] .+/)
      if (checkCont) {
        e.preventDefault()
        const prefix = `${checkCont[1]}${checkCont[2]} [ ] `
        const insert = '\n' + prefix
        const newVal = value.slice(0, selectionStart) + insert + value.slice(selectionStart)
        setContent(newVal)
        const pos = selectionStart + insert.length
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos })
        return
      }

      // Bullet continuation
      const bulletMatch = currentLine.match(/^(\s*)([-*]) $/)
      if (bulletMatch) {
        // Empty bullet — remove it
        e.preventDefault()
        const newVal = value.slice(0, lineStart) + value.slice(selectionStart)
        setContent(newVal)
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart })
        return
      }
      const bulletCont = currentLine.match(/^(\s*)([-*]) .+/)
      if (bulletCont) {
        e.preventDefault()
        const prefix = `${bulletCont[1]}${bulletCont[2]} `
        const insert = '\n' + prefix
        const newVal = value.slice(0, selectionStart) + insert + value.slice(selectionStart)
        setContent(newVal)
        const pos = selectionStart + insert.length
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos })
        return
      }

      // Numbered list continuation
      const numMatch = currentLine.match(/^(\s*)(\d+)\. $/)
      if (numMatch) {
        e.preventDefault()
        const newVal = value.slice(0, lineStart) + value.slice(selectionStart)
        setContent(newVal)
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart })
        return
      }
      const numCont = currentLine.match(/^(\s*)(\d+)\. .+/)
      if (numCont) {
        e.preventDefault()
        const nextNum = parseInt(numCont[2], 10) + 1
        const prefix = `${numCont[1]}${nextNum}. `
        const insert = '\n' + prefix
        const newVal = value.slice(0, selectionStart) + insert + value.slice(selectionStart)
        setContent(newVal)
        const pos = selectionStart + insert.length
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos })
        return
      }

      // Blockquote continuation
      const quoteMatch = currentLine.match(/^> $/)
      if (quoteMatch) {
        e.preventDefault()
        const newVal = value.slice(0, lineStart) + value.slice(selectionStart)
        setContent(newVal)
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart })
        return
      }
      const quoteCont = currentLine.match(/^> .+/)
      if (quoteCont) {
        e.preventDefault()
        const insert = '\n> '
        const newVal = value.slice(0, selectionStart) + insert + value.slice(selectionStart)
        setContent(newVal)
        const pos = selectionStart + insert.length
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos })
        return
      }
    }

    // Keyboard shortcuts: Ctrl/Cmd + B/I/K
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      const { selectionStart, selectionEnd, value } = ta
      const selected = value.slice(selectionStart, selectionEnd)
      if (!selected) return

      let wrap = ''
      if (e.key === 'b') wrap = '**'
      else if (e.key === 'i') wrap = '*'
      else if (e.key === 'k') {
        e.preventDefault()
        const replacement = `[${selected}](url)`
        const newVal = value.slice(0, selectionStart) + replacement + value.slice(selectionEnd)
        setContent(newVal)
        // Select "url" for easy replacement
        const urlStart = selectionStart + selected.length + 3
        requestAnimationFrame(() => { ta.selectionStart = urlStart; ta.selectionEnd = urlStart + 3 })
        return
      }
      if (wrap) {
        e.preventDefault()
        const replacement = `${wrap}${selected}${wrap}`
        const newVal = value.slice(0, selectionStart) + replacement + value.slice(selectionEnd)
        setContent(newVal)
        const pos = selectionStart + wrap.length
        requestAnimationFrame(() => { ta.selectionStart = pos; ta.selectionEnd = pos + selected.length })
      }
    }
  }, [])

  if (isLoading) return <p style={{ color: '#8b85a0' }}>Loading...</p>
  if (error || !note) return <p style={{ color: '#e74c3c' }}>Note not found</p>

  return (
    <>
      <style>{`
        .create-page-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 768px) {
          .create-page-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <Link to="/" style={{ color: '#9b8ec4', textDecoration: 'none', fontSize: 14 }}>
        &larr; Back to Dashboard
      </Link>

      <h1 style={{ color: '#3a3650', margin: '1rem 0 0.25rem' }}>{note.title}</h1>
      {note.notes && (
        <p style={{ color: '#8b85a0', fontSize: 14, margin: '0 0 1rem' }}>{note.notes}</p>
      )}

      <div className="create-page-grid">
        <div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your page content here..."
            style={{
              width: '100%',
              minHeight: 350,
              padding: '0.75rem',
              fontSize: 15,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              lineHeight: 1.6,
              border: '1px solid #d4d0de',
              borderRadius: 8,
              background: '#faf9fc',
              color: '#3a3650',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '0.5rem 0' }}>
            <p style={{ color: '#8b85a0', fontSize: 12, margin: 0, flex: 1 }}>
              <strong>Formatting:</strong> **bold** &middot; *italic* &middot; ~~strike~~ &middot; `code` &middot; [link](url) &middot; # Heading &middot; {'>'} Quote &middot; - Bullet &middot; 1. Numbered &middot; - [ ] Task &middot; --- Divider
              <br />
              <strong>Shortcuts:</strong> Ctrl+B bold &middot; Ctrl+I italic &middot; Ctrl+K link
            </p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !content.trim()}
            style={{
              marginTop: '0.25rem',
              padding: '0.5rem 1.25rem',
              background: '#9b8ec4',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: mutation.isPending || !content.trim() ? 'not-allowed' : 'pointer',
              opacity: mutation.isPending || !content.trim() ? 0.6 : 1,
            }}
          >
            {mutation.isPending ? 'Publishing...' : 'Publish to Notion'}
          </button>

          {mutation.isError && (
            <p style={{ color: '#e74c3c', fontSize: 13, marginTop: '0.5rem' }}>
              Failed to publish. Please try again.
            </p>
          )}

          {content.trim() && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem',
              border: '1px solid #e8e4f0',
              borderRadius: 8,
              background: '#fff',
              fontSize: 14,
              color: '#3a3650',
              lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: '#b5b0c8', marginBottom: 8, letterSpacing: '0.05em' }}>Preview</div>
              {renderPreview(content)}
            </div>
          )}
        </div>

        <div style={widgetStyle}>
          <div style={widgetHeaderStyle}>Pomodoro</div>
          <PomodoroTimer activeTodo={fakeNote} onClearActive={() => {}} />
        </div>
      </div>
    </>
  )
}
