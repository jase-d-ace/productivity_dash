import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: '1.25rem', color: '#2d2a26' }}>
        Notion Dashboard
      </h1>
      <Outlet />
    </div>
  )
}
