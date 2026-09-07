import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createNote } from '../api'

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d9d1c7',
  borderRadius: 8,
  fontSize: 15,
  background: '#fff',
  color: '#2d2a26',
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
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem', padding: '1rem', background: '#faf7f3', borderRadius: 8, border: '1px solid #e0d8cf' }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quick capture..." style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma-separated)" style={{ ...smallInputStyle, flex: 1 }} />
        <input value={body} onChange={e => setBody(e.target.value)} placeholder="Notes (optional)" style={{ ...smallInputStyle, flex: 2 }} />
      </div>
      <button type="submit" disabled={mutation.isPending} style={{ alignSelf: 'flex-start', padding: '6px 16px', background: '#5b7f6a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
        {mutation.isPending ? 'Saving...' : 'Capture'}
      </button>
    </form>
  )
}
