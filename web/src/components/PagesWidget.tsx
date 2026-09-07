import { useQuery } from '@tanstack/react-query'
import { fetchPages, type ChildPage } from '../api'

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
  const { data, isLoading } = useQuery({ queryKey: ['pages'], queryFn: fetchPages })
  const pages: ChildPage[] = data?.results ?? []

  if (isLoading) return <p style={{ color: '#8b85a0', fontSize: 14 }}>Loading...</p>
  if (pages.length === 0) return <p style={{ color: '#8b85a0', fontSize: 14 }}>No published pages yet.</p>

  return (
    <div>
      {pages.map(page => (
        <a
          key={page.id}
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            padding: '0.5rem 0',
            borderBottom: '1px solid #e8e4f0',
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
      ))}
    </div>
  )
}
