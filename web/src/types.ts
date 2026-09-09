export interface Note {
  id: string
  title: string
  tags: string[]
  notes: string
  created_time: string
  done: boolean
  pinned: boolean
  archived: boolean
}

export interface NotesResponse {
  results: Note[]
  has_more: boolean
  next_cursor: string | null
}
