const PASTEL_COLORS = ['#CCF6FF', '#FFE2F9', '#B4F1C6', '#E0D8F5', '#FFEB9C', '#D8E4F8', '#F5D8E8']

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
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: bg, color: '#4a4462', marginRight: 4 }}>
      #{tag}
    </span>
  )
}
