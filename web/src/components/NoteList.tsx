import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchNotes, searchNotes } from '../api'
import CaptureForm from './CaptureForm'
import NoteCard from './NoteCard'

export default function NoteList() {
  const [search, setSearch] = useState('')

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: () => fetchNotes(),
    enabled: !search,
  })

  const searchQuery = useQuery({
    queryKey: ['notes', 'search', search],
    queryFn: () => searchNotes(search),
    enabled: !!search,
  })

  const notes = search ? searchQuery.data?.results : notesQuery.data?.results
  const isLoading = search ? searchQuery.isLoading : notesQuery.isLoading

  return (
    <div>
      <CaptureForm />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search notes..."
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, marginBottom: '1rem', boxSizing: 'border-box' }}
      />
      {isLoading && <p style={{ color: '#999' }}>Loading...</p>}
      {notes?.map(n => <NoteCard key={n.id} note={n} />)}
      {notes && notes.length === 0 && <p style={{ color: '#999' }}>No notes found.</p>}
    </div>
  )
}
