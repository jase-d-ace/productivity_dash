import type { Note } from '../types'
import TagBadge from './TagBadge'

function relativeDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NoteCard({ note }: { note: Note }) {
  return (
    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #e8e4f0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ color: '#8b85a0', fontSize: 13 }}>{relativeDate(note.created_time)}</span>
        <strong style={{ color: '#3a3650' }}>{note.title || '(empty)'}</strong>
        {note.tags.map(t => <TagBadge key={t} tag={t} />)}
      </div>
      {note.notes && <p style={{ margin: '4px 0 0', color: '#8b85a0', fontSize: 14 }}>{note.notes}</p>}
    </div>
  )
}
