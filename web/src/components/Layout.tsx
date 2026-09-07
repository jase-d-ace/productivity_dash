import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}>
      <nav style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e2e2', paddingBottom: '0.75rem' }}>
        <NavLink to="/" end style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, textDecoration: 'none', color: isActive ? '#111' : '#666' })}>
          Notes
        </NavLink>
        <NavLink to="/todos" style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400, textDecoration: 'none', color: isActive ? '#111' : '#666' })}>
          Todos
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
