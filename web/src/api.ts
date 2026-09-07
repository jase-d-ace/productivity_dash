import type { Note, NotesResponse } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const fetchNotes = (cursor?: string) =>
  request<NotesResponse>(`/notes${cursor ? `?start_cursor=${cursor}` : ''}`)

export const searchNotes = (q: string) =>
  request<{ results: Note[] }>(`/notes/search?q=${encodeURIComponent(q)}`)

export const createNote = (data: { title: string; tags?: string[]; body?: string }) =>
  request<Note>('/notes', { method: 'POST', body: JSON.stringify(data) })

export const updateNote = (id: string, data: Partial<{ title: string; tags: string[]; notes: string; done: boolean }>) =>
  request<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deleteNote = (id: string) =>
  request<{ id: string }>(`/notes/${id}`, { method: 'DELETE' })

export const fetchNote = (id: string) =>
  request<Note>(`/notes/${id}`)

export const publishPage = (noteId: string, data: { title: string; content: string }) =>
  request<{ id: string; title: string; url: string; created_time: string }>(
    `/notes/${noteId}/publish`,
    { method: 'POST', body: JSON.stringify(data) }
  )

export interface ChildPage {
  id: string
  title: string
  url: string
  created_time: string
  parent_id: string
}

export const fetchPages = () =>
  request<{ results: ChildPage[] }>('/pages')

export const fetchTodos = () =>
  request<{ results: Note[] }>('/todos')

export const saveTodoOrder = (order: string[]) =>
  request<{ ok: boolean }>('/todos/order', { method: 'PATCH', body: JSON.stringify({ order }) })
