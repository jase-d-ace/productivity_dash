import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Note } from '../types'
import TagBadge from './TagBadge'

interface Props {
  todo: Note
  onToggle: (id: string, done: boolean) => void
}

export default function TodoItem({ todo, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} style={{ cursor: 'grab', userSelect: 'none', color: '#ccc' }}>&#x2630;</span>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id, !todo.done)}
        style={{ width: 18, height: 18, cursor: 'pointer' }}
      />
      <span style={{ textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? '#aaa' : '#111' }}>
        {todo.title}
      </span>
      {todo.tags.filter(t => !['todo', 'to-do', 'to do'].includes(t.toLowerCase())).map(t => (
        <TagBadge key={t} tag={t} />
      ))}
    </div>
  )
}
