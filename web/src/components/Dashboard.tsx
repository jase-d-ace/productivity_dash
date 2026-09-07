import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTodos } from '../api'
import type { Note } from '../types'
import NoteList from './NoteList'
import PomodoroTimer from './PomodoroTimer'
import TodoView from './TodoView'
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
  marginBottom: '1rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #e8e4f0',
  background: 'linear-gradient(135deg, #f0faff, #f8f4ff)',
  margin: '-1.25rem -1.25rem 1rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '14px 14px 0 0',
  color: '#6b6189',
}

export default function Dashboard() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
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
          <div style={widgetHeaderStyle}>Notes</div>
          <NoteList />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, overflow: 'hidden' }}>
          <div style={widgetStyle}>
            <div style={widgetHeaderStyle}>Pomodoro</div>
            <PomodoroTimer activeTodo={activeTodo} onClearActive={() => setActiveTaskId(null)} />
          </div>
          <div style={widgetStyle}>
            <div style={widgetHeaderStyle}>Todos</div>
            <TodoView activeTaskId={activeTaskId} onSetActive={setActiveTaskId} />
          </div>
          <div style={widgetStyle}>
            <div style={widgetHeaderStyle}>Pages</div>
            <PagesWidget />
          </div>
        </div>
      </div>
    </>
  )
}
