const PASTEL_COLORS = ['#e8dff0', '#dceee4', '#fde8d8', '#dbe8f0', '#f0e8db', '#dfe8f0', '#f0dfe8']

function hashTag(tag: string) {
  let h = 0
  for (let i = 0; i < tag.length; i++) {
    h = ((h << 5) - h + tag.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export default function TagBadge({ tag }: { tag: string }) {
  const bg = PASTEL_COLORS[hashTag(tag.toLowerCase()) % PASTEL_COLORS.length]
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 12, background: bg, color: '#2d2a26', marginRight: 4 }}>
      #{tag}
    </span>
  )
}
