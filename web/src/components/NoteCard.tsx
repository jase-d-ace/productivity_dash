import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateNote } from '../api'
import type { Note, NotesResponse } from '../types'
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

const TODO_TAGS = ['todo', 'to-do', 'to do']

export default function NoteCard({ note }: { note: Note }) {
  const qc = useQueryClient()
  const isTodo = note.tags.some(t => TODO_TAGS.includes(t.toLowerCase()))

  const makeToDoMutation = useMutation({
    mutationFn: () => updateNote(note.id, { tags: [...note.tags, 'todo'] }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notes'] })
      const previous = qc.getQueryData<NotesResponse>(['notes'])
      qc.setQueryData<NotesResponse>(['notes'], old => ({
        results: (old?.results ?? []).map(n => n.id === note.id ? { ...n, tags: [...n.tags, 'todo'] } : n),
        has_more: old?.has_more ?? false,
        next_cursor: old?.next_cursor ?? null,
      }))
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) qc.setQueryData(['notes'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #e8e4f0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ color: '#8b85a0', fontSize: 13 }}>{relativeDate(note.created_time)}</span>
        <strong style={{ color: '#3a3650' }}>{note.title || '(empty)'}</strong>
        {note.tags.map(t => <TagBadge key={t} tag={t} />)}
        {!isTodo && (
          <button
            onClick={() => makeToDoMutation.mutate()}
            disabled={makeToDoMutation.isPending}
            style={{
              background: 'none',
              border: '1px solid #d4d0de',
              borderRadius: 8,
              padding: '1px 7px',
              fontSize: 11,
              fontWeight: 600,
              color: '#9b8ec4',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + todo
          </button>
        )}
      </div>
      {note.notes && <p style={{ margin: '4px 0 0', color: '#8b85a0', fontSize: 14 }}>{note.notes}</p>}
    </div>
  )
}
