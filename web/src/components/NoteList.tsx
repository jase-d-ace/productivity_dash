import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { fetchNotes, searchNotes, updateNote } from '../api'
import type { Note, NotesResponse } from '../types'
import CaptureForm from './CaptureForm'
import NoteCard from './NoteCard'

function parseSearch(search: string): { type: 'tag'; tags: string[] } | { type: 'text'; value: string } | null {
  const trimmed = search.trim()
  if (!trimmed) return null
  const tagMatch = trimmed.match(/^tag:(.+)$/i)
  if (tagMatch) {
    const tags = tagMatch[1].split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    return tags.length ? { type: 'tag', tags } : null
  }
  return { type: 'text', value: trimmed }
}

function noteMatchesTags(note: Note, filterTags: string[]): boolean {
  return filterTags.some(filter =>
    note.tags.some(tag => tag.toLowerCase().includes(filter))
  )
}

export default function NoteList() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const parsed = parseSearch(search)

  const pinMutation = useMutation({
    mutationFn: (id: string) => updateNote(id, { pinned: true }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notes'] })
      await qc.cancelQueries({ queryKey: ['pinned'] })
      const prevNotes = qc.getQueryData<NotesResponse>(['notes'])
      const prevPinned = qc.getQueryData<{ results: Note[] }>(['pinned'])
      const note = prevNotes?.results.find(n => n.id === id)
      qc.setQueryData<NotesResponse>(['notes'], old => ({
        results: (old?.results ?? []).filter(n => n.id !== id),
        has_more: old?.has_more ?? false,
        next_cursor: old?.next_cursor ?? null,
      }))
      if (note) {
        qc.setQueryData(['pinned'], { results: [{ ...note, pinned: true }, ...(prevPinned?.results ?? [])] })
      }
      return { prevNotes, prevPinned }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevNotes) qc.setQueryData(['notes'], ctx.prevNotes)
      if (ctx?.prevPinned) qc.setQueryData(['pinned'], ctx.prevPinned)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['pinned'] })
    },
  })

  const filterTags = parsed?.type === 'tag' ? parsed.tags : undefined

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: () => fetchNotes(),
    enabled: parsed?.type !== 'text',
  })

  const searchQuery = useQuery({
    queryKey: ['notes', 'search', parsed?.type === 'text' ? parsed.value : ''],
    queryFn: () => searchNotes((parsed as { type: 'text'; value: string }).value),
    enabled: parsed?.type === 'text',
  })

  const allNotes = parsed?.type === 'text' ? searchQuery.data?.results : notesQuery.data?.results
  const isLoading = parsed?.type === 'text' ? searchQuery.isLoading : notesQuery.isLoading

  const notes = useMemo(() => {
    if (!allNotes) return undefined
    if (!filterTags) return allNotes
    return allNotes.filter(n => noteMatchesTags(n, filterTags))
  }, [allNotes, filterTags])

  const matchedNoteIds = useMemo(() => new Set(notes?.map(n => n.id) ?? []), [notes])

  const handleTagClick = (tag: string) => {
    setSearch(prev => {
      const current = parseSearch(prev)
      if (current?.type === 'tag') {
        const lowerTag = tag.toLowerCase()
        if (current.tags.includes(lowerTag)) {
          const remaining = current.tags.filter(t => t !== lowerTag)
          return remaining.length ? `tag:${remaining.join(',')}` : ''
        }
        return `tag:${[...current.tags, tag].join(',')}`
      }
      return `tag:${tag}`
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <CaptureForm />
      <style>{`
        @keyframes noteIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .note-item {
          transition: opacity 0.25s ease, max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease;
          overflow: hidden;
        }
        .note-item.visible {
          opacity: 1;
          max-height: 200px;
          animation: noteIn 0.25s ease;
        }
        .note-item.hidden {
          opacity: 0;
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
        }
      `}</style>
      <div style={{ position: 'relative', marginBottom: '1rem', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes... (tag:name to filter by tag)"
          style={{ width: '100%', padding: '8px 12px', paddingRight: search ? 32 : 12, border: '1px solid #d4d0de', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: '#fff', color: '#3a3650' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9a93a8', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
          >
            &times;
          </button>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {isLoading && <p style={{ color: '#8b85a0' }}>Loading...</p>}
        {allNotes?.map(n => (
          <div key={n.id} className={`note-item ${!filterTags || matchedNoteIds.has(n.id) ? 'visible' : 'hidden'}`}>
            <NoteCard note={n} onPinToggle={() => pinMutation.mutate(n.id)} onTagClick={handleTagClick} filterTags={filterTags} />
          </div>
        ))}
        {notes && notes.length === 0 && !isLoading && <p style={{ color: '#8b85a0' }}>No notes found.</p>}
      </div>
    </div>
  )
}
