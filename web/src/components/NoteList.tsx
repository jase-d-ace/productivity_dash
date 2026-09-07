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
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d1c7', borderRadius: 8, fontSize: 14, marginBottom: '1rem', boxSizing: 'border-box', background: '#fff', color: '#2d2a26' }}
      />
      {isLoading && <p style={{ color: '#7a7067' }}>Loading...</p>}
      {notes?.map(n => <NoteCard key={n.id} note={n} />)}
      {notes && notes.length === 0 && <p style={{ color: '#7a7067' }}>No notes found.</p>}
    </div>
  )
}
