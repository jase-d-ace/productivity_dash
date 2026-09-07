import NoteList from './NoteList'
import TodoView from './TodoView'

const widgetStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e0d8cf',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(45, 42, 38, 0.06)',
  padding: '1.25rem',
  minWidth: 0,
}

const widgetHeaderStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginBottom: '1rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #e0d8cf',
  background: '#f9f6f2',
  margin: '-1.25rem -1.25rem 1rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '12px 12px 0 0',
  color: '#2d2a26',
}

export default function Dashboard() {
  return (
    <>
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.25rem;
        }
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="dashboard-grid">
        <div style={widgetStyle}>
          <div style={widgetHeaderStyle}>Notes</div>
          <NoteList />
        </div>
        <div style={widgetStyle}>
          <div style={widgetHeaderStyle}>Todos</div>
          <TodoView />
        </div>
      </div>
    </>
  )
}
