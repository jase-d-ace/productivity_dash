import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPinnedNotes, fetchTodos } from '../api'
import type { Note } from '../types'
import NoteList from './NoteList'
import PinnedWidget from './PinnedWidget'
import PomodoroTimer from './PomodoroTimer'
import TodoView from './TodoView'
import ArchiveWidget from './ArchiveWidget'
import PagesWidget from './PagesWidget'

const widgetStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #ddd8e8',
  borderRadius: 14,
  boxShadow: '0 2px 8px rgba(155, 142, 196, 0.08)',
  padding: '1.25rem',
  minWidth: 0,
}

const widgetHeaderStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
  background: 'linear-gradient(135deg, #f0faff, #f8f4ff)',
  margin: '-1.25rem -1.25rem 0',
  padding: '0.75rem 1.25rem',
  borderRadius: '14px 14px 0 0',
  color: '#6b6189',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  userSelect: 'none' as const,
}

function CollapsibleWidget({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={widgetStyle}>
      <div style={widgetHeaderStyle} onClick={() => setOpen(!open)}>
        {title}
        <span style={{ fontSize: 12, transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}>{'\u25B2'}</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.25s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ marginTop: '1rem' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
  const pinnedQuery = useQuery({ queryKey: ['pinned'], queryFn: fetchPinnedNotes })
  const hasPinned = (pinnedQuery.data?.results ?? []).length > 0
  const todos: Note[] = data?.results ?? []
  const activeTodo = todos.find(t => t.id === activeTaskId) ?? null

  return (
    <>
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.25rem;
          height: calc(100vh - 6rem);
        }
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr; height: auto; }
        }
      `}</style>
      <div className="dashboard-grid">
        <div style={{ ...widgetStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ ...widgetHeaderStyle, cursor: 'default' }}>Notes</div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <NoteList />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, overflow: 'auto' }}>
          {hasPinned && (
            <CollapsibleWidget title="Pinned">
              <PinnedWidget />
            </CollapsibleWidget>
          )}
          <CollapsibleWidget title="Pomodoro">
            <PomodoroTimer activeTodo={activeTodo} onClearActive={() => setActiveTaskId(null)} />
          </CollapsibleWidget>
          <CollapsibleWidget title="Todos">
            <TodoView activeTaskId={activeTaskId} onSetActive={setActiveTaskId} />
          </CollapsibleWidget>
          <CollapsibleWidget title="Pages">
            <PagesWidget />
          </CollapsibleWidget>
          <CollapsibleWidget title="Archive" defaultOpen={false}>
            <ArchiveWidget />
          </CollapsibleWidget>
        </div>
      </div>
    </>
  )
}
