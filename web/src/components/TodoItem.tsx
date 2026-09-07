import type React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Note } from '../types'
import TagBadge from './TagBadge'

interface Props {
  todo: Note
  onToggle: (id: string, done: boolean) => void
  activeTaskId: string | null
  onSetActive: (id: string | null) => void
}

export default function TodoItem({ todo, onToggle, activeTaskId, onSetActive }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id })

  const isActive = todo.id === activeTaskId

  const filteredTags = todo.tags.filter(t => !['todo', 'to-do', 'to do'].includes(t.toLowerCase()))

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '8px 0 8px 8px',
    borderBottom: '1px solid #e8e4f0',
    borderLeft: isActive ? '3px solid #9b8ec4' : '3px solid transparent',
    background: isActive ? '#f0edff' : 'transparent',
    borderRadius: isActive ? 4 : 0,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span {...attributes} {...listeners} style={{ cursor: 'grab', userSelect: 'none', color: '#c5c0d4' }}>&#x2630;</span>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id, !todo.done)}
          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#9b8ec4' }}
        />
        <span style={{ flex: 1, textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? '#b5b0c8' : '#3a3650' }}>
          {todo.title}
        </span>
        {!todo.done && (
          <button
            onClick={() => onSetActive(isActive ? null : todo.id)}
            title="Focus on this task"
            aria-label="Focus on this task"
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              border: isActive ? '1px solid #9b8ec4' : '1px solid #ddd8e8',
              background: isActive ? '#9b8ec4' : 'transparent',
              color: isActive ? '#fff' : '#8b85a0',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {isActive ? 'Focusing' : 'Focus'}
          </button>
        )}
      </div>
      {filteredTags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 4, paddingLeft: 46 }}>
          {filteredTags.map(t => (
            <TagBadge key={t} tag={t} size="small" />
          ))}
        </div>
      )}
    </div>
  )
}
