import { useState, useEffect, useCallback } from 'react'
import { contentAPI } from '../api'

export default function ContentTab() {
  const [content,  setContent]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [searching, setSearching] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await contentAPI.getAll()
      setContent(Array.isArray(data) ? data : [])
    } catch {
      setError('Could not load content. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleSearch(e) {
    e.preventDefault()
    if (!search.trim()) { loadAll(); return }
    setSearching(true)
    setError('')
    try {
      const data = await contentAPI.search(search.trim())
      if (data.error) {
        setContent([])
        setError(data.error)
      } else {
        setContent(Array.isArray(data) ? data : [])
      }
    } catch {
      setError('Search failed.')
    } finally {
      setSearching(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this content record?')) return
    const res = await contentAPI.deleteById(id)
    if (!res.error) setContent(c => c.filter(x => x.contentID !== id))
  }

  function formatDate(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.title}>Content Library</h2>
          <p style={styles.sub}>All uploaded content registered on this server</p>
        </div>
        <button className="btn-ghost" onClick={loadAll} style={styles.refreshBtn}>
          ↻ Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={styles.searchRow}>
        <input
          type="text"
          placeholder="Search by name or description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary" disabled={searching}
                style={{ flexShrink: 0, padding: '11px 20px' }}>
          {searching ? <span className="spinner" /> : 'Search'}
        </button>
        {search && (
          <button type="button" className="btn-ghost"
                  onClick={() => { setSearch(''); loadAll() }}
                  style={{ flexShrink: 0 }}>
            Clear
          </button>
        )}
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={styles.loadingRow}>
            <span className="spinner" />
            <span style={{ color: 'var(--text)', fontSize: '13px' }}>Loading content…</span>
          </div>
        ) : content.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◈</div>
            <h3 style={{ color: 'var(--text-2)', fontSize: '16px' }}>No content found</h3>
            <p>Upload your first item from the Upload tab.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Uploaded</th>
                <th>Content ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.map(item => (
                <tr key={item.contentID} className="fade-up">
                  <td style={{ color: 'var(--text-strong)', fontWeight: 600, fontSize: '13px' }}>
                    {item.name || '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${item.type}`}>{item.type || '—'}</span>
                  </td>
                  <td style={{ maxWidth: '200px', color: 'var(--text)' }}>
                    {item.description
                      ? item.description.length > 40
                        ? item.description.slice(0, 40) + '…'
                        : item.description
                      : <span style={{ opacity: 0.35 }}>—</span>}
                  </td>
                  <td style={{ fontSize: '12px' }}>{formatDate(item.uploadDate)}</td>
                  <td><span className="mono">{String(item.contentID).slice(0, 12)}</span></td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(item.contentID)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
  topRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: '22px', fontWeight: 700 },
  sub: { fontSize: '14px', color: 'var(--text)', margin: '4px 0 0' },
  refreshBtn: { padding: '8px 16px', fontSize: '13px', flexShrink: 0 },
  searchRow: { display: 'flex', gap: '10px' },
  loadingRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '48px',
  },
}