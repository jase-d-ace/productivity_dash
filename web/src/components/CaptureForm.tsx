import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createNote } from '../api'
import type { Note, NotesResponse } from '../types'

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d4d0de',
  borderRadius: 10,
  fontSize: 15,
  background: '#fff',
  color: '#3a3650',
  boxSizing: 'border-box',
  width: '100%',
  minWidth: 0,
}

const smallInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '6px 10px',
  fontSize: 13,
}

export default function CaptureForm() {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [body, setBody] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: createNote,
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['notes'] })
      const previous = qc.getQueryData<NotesResponse>(['notes'])
      const optimistic: Note = {
        id: `temp-${Date.now()}`,
        title: data.title,
        tags: data.tags ?? [],
        notes: data.body ?? '',
        created_time: new Date().toISOString(),
        done: false,
        pinned: false,
        archived: false,
      }
      qc.setQueryData<NotesResponse>(['notes'], old => ({
        results: [optimistic, ...(old?.results ?? [])],
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const rawTitle = title.trim()
    // Extract #hashtags from title and merge with explicit tags
    const hashtagPattern = /#([\w-]+)/g
    const hashTags = [...rawTitle.matchAll(hashtagPattern)].map(m => m[1])
    const cleanTitle = rawTitle.replace(hashtagPattern, '').replace(/\s{2,}/g, ' ').trim()
    const explicitTags = tags.split(',').map(t => t.replace(/^#/, '').trim()).filter(Boolean)
    const allTags = [...new Set([...explicitTags, ...hashTags])]
    mutation.mutate({ title: cleanTitle || rawTitle, tags: allTags.length ? allTags : undefined, body: body.trim() || undefined })
    setTitle('')
    setTags('')
    setBody('')
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem', padding: '1rem', background: '#f8f5fc', borderRadius: 10, border: '1px solid #e4dff0' }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What's on your mind?" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma-separated)" style={{ ...smallInputStyle, flex: '1 1 120px' }} />
        <input value={body} onChange={e => setBody(e.target.value)} placeholder="Notes (optional)" style={{ ...smallInputStyle, flex: '2 1 200px' }} />
      </div>
      <button type="submit" disabled={mutation.isPending} style={{ alignSelf: 'flex-start', padding: '7px 18px', background: '#9b8ec4', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.01em' }}>
        {mutation.isPending ? 'Saving...' : 'Capture'}
      </button>
    </form>
  )
}
