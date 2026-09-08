import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deletePage, fetchPages, type ChildPage } from '../api'

function relativeDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PagesWidget() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['pages'], queryFn: fetchPages })
  const pages: ChildPage[] = data?.results ?? []

  const deleteM = useMutation({
    mutationFn: (id: string) => deletePage(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['pages'] })
      const prev = qc.getQueryData<{ results: ChildPage[] }>(['pages'])
      qc.setQueryData(['pages'], { results: prev?.results.filter(p => p.id !== id) ?? [] })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['pages'], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['pages'] }),
  })

  if (isLoading) return <p style={{ color: '#8b85a0', fontSize: 14 }}>Loading...</p>
  if (pages.length === 0) return <p style={{ color: '#8b85a0', fontSize: 14 }}>No published pages yet.</p>

  return (
    <div>
      {pages.map(page => (
        <div
          key={page.id}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            padding: '0.5rem 0',
            borderBottom: '1px solid #e8e4f0',
          }}
        >
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              flex: 1,
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span style={{ color: '#8b85a0', fontSize: 13, flexShrink: 0 }}>{relativeDate(page.created_time)}</span>
            <span style={{ color: '#3a3650', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {page.title || '(untitled)'}
            </span>
            <span style={{ color: '#9b8ec4', fontSize: 12, marginLeft: 'auto', flexShrink: 0 }}>&#8599;</span>
          </a>
          <button
            onClick={() => deleteM.mutate(page.id)}
            title="Delete"
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
