const COLORS: Record<string, string> = {
  todo: '#e0e7ff',
  'to-do': '#e0e7ff',
  'to do': '#e0e7ff',
}

export default function TagBadge({ tag }: { tag: string }) {
  const bg = COLORS[tag.toLowerCase()] ?? '#f3f4f6'
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 12, background: bg, color: '#374151', marginRight: 4 }}>
      #{tag}
    </span>
  )
}
