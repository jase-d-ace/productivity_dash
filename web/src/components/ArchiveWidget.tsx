import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchArchivedNotes, restoreNote, permanentDeleteNote } from '../api'
import type { Note, NotesResponse } from '../types'

function relativeDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ArchiveWidget() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['archived'], queryFn: fetchArchivedNotes })
  const notes: Note[] = data?.results ?? []

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreNote(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['archived'] })
      await qc.cancelQueries({ queryKey: ['notes'] })
      const prevArchived = qc.getQueryData<{ results: Note[] }>(['archived'])
      const prevNotes = qc.getQueryData<NotesResponse>(['notes'])
      const note = prevArchived?.results.find(n => n.id === id)
      qc.setQueryData(['archived'], { results: prevArchived?.results.filter(n => n.id !== id) ?? [] })
      if (note) {
        qc.setQueryData<NotesResponse>(['notes'], old => ({
          results: [{ ...note, archived: false }, ...(old?.results ?? [])],
          has_more: old?.has_more ?? false,
          next_cursor: old?.next_cursor ?? null,
        }))
      }
      return { prevArchived, prevNotes }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevArchived) qc.setQueryData(['archived'], ctx.prevArchived)
      if (ctx?.prevNotes) qc.setQueryData(['notes'], ctx.prevNotes)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['archived'] })
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => permanentDeleteNote(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['archived'] })
      const prev = qc.getQueryData<{ results: Note[] }>(['archived'])
      qc.setQueryData(['archived'], { results: prev?.results.filter(n => n.id !== id) ?? [] })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['archived'], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['archived'] }),
  })

  if (isLoading) return <p style={{ color: '#8b85a0', fontSize: 14 }}>Loading...</p>
  if (notes.length === 0) return <p style={{ color: '#8b85a0', fontSize: 14, margin: 0 }}>Nothing in trash.</p>

  return (
    <div>
      {notes.map(note => (
        <div
          key={note.id}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            padding: '0.5rem 0',
            borderBottom: '1px solid #e8e4f0',
          }}
        >
          <span style={{ color: '#8b85a0', fontSize: 13, flexShrink: 0 }}>{relativeDate(note.created_time)}</span>
          <span style={{ color: '#3a3650', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {note.title || '(untitled)'}
          </span>
          <button
            onClick={() => restoreMutation.mutate(note.id)}
            title="Restore"
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
              flexShrink: 0,
            }}
          >
            restore
          </button>
          <button
            onClick={() => permanentDeleteMutation.mutate(note.id)}
            title="Delete permanently"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#c4b5d4',
              fontSize: 15,
              padding: '0 4px',
              flexShrink: 0,
            }}
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  )
}
