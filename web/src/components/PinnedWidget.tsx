import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPinnedNotes, updateNote } from '../api'
import type { Note, NotesResponse } from '../types'
import NoteCard from './NoteCard'

export default function PinnedWidget() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['pinned'], queryFn: fetchPinnedNotes })
  const notes: Note[] = data?.results ?? []

  const unpinMutation = useMutation({
    mutationFn: (id: string) => updateNote(id, { pinned: false }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['pinned'] })
      await qc.cancelQueries({ queryKey: ['notes'] })
      const prevPinned = qc.getQueryData<{ results: Note[] }>(['pinned'])
      const prevNotes = qc.getQueryData<NotesResponse>(['notes'])
      const note = prevPinned?.results.find(n => n.id === id)
      qc.setQueryData(['pinned'], { results: prevPinned?.results.filter(n => n.id !== id) ?? [] })
      if (note) {
        qc.setQueryData<NotesResponse>(['notes'], old => ({
          results: [{ ...note, pinned: false }, ...(old?.results ?? [])],
          has_more: old?.has_more ?? false,
          next_cursor: old?.next_cursor ?? null,
        }))
      }
      return { prevPinned, prevNotes }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevPinned) qc.setQueryData(['pinned'], ctx.prevPinned)
      if (ctx?.prevNotes) qc.setQueryData(['notes'], ctx.prevNotes)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['pinned'] })
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  if (isLoading) return <p style={{ color: '#8b85a0', fontSize: 14 }}>Loading...</p>
  if (notes.length === 0) return null

  return (
    <div>
      {notes.map(note => (
        <NoteCard key={note.id} note={note} onPinToggle={() => unpinMutation.mutate(note.id)} />
      ))}
    </div>
  )
}
