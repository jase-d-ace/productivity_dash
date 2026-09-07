import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createNote } from '../api'

export default function CaptureForm() {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [body, setBody] = useState('')
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      setTitle('')
      setTags('')
      setBody('')
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    mutation.mutate({ title: title.trim(), tags: tagList.length ? tagList : undefined, body: body.trim() || undefined })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem', padding: '1rem', background: '#fafafa', borderRadius: 8 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quick capture..." style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 15 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma-separated)" style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
        <input value={body} onChange={e => setBody(e.target.value)} placeholder="Notes (optional)" style={{ flex: 2, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
      </div>
      <button type="submit" disabled={mutation.isPending} style={{ alignSelf: 'flex-start', padding: '6px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
        {mutation.isPending ? 'Saving...' : 'Capture'}
      </button>
    </form>
  )
}
