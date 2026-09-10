import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem', flex: 1, width: '100%' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: '1.25rem', color: '#3a3650', letterSpacing: '-0.01em' }}>
          Inkwell
        </h1>
        <Outlet />
      </div>
      <footer style={{
        borderTop: '1px solid #e4dff0',
        padding: '1.25rem 1rem',
        textAlign: 'center',
        fontSize: 13,
        color: '#9a93a8',
        letterSpacing: '0.01em',
      }}>
        <span>&copy; {new Date().getFullYear()} Inkwell</span>
        <span style={{ margin: '0 8px' }}>&middot;</span>
        <a href="/privacy.html" style={{ color: '#9a93a8', textDecoration: 'none' }}>Privacy</a>
        <span style={{ margin: '0 8px' }}>&middot;</span>
        <a href="/terms.html" style={{ color: '#9a93a8', textDecoration: 'none' }}>Terms</a>
      </footer>
    </div>
  )
}
