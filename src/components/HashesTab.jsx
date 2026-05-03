import { useState, useEffect, useCallback } from 'react'
import { hashAPI } from '../api'

export default function HashesTab() {
  const [hashes,  setHashes]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [recentRes, statsRes] = await Promise.all([
        hashAPI.getRecent(),
        hashAPI.getStats(),
      ])
      setHashes(Array.isArray(recentRes) ? recentRes : [])
      if (!statsRes.error) setStats(statsRes)
    } catch {
      setError('Could not load hashes. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm('Delete this hash record?')) return
    const res = await hashAPI.deleteById(id)
    if (!res.error) setHashes(h => h.filter(x => x.id !== id))
  }

  function truncate(str, len = 24) {
    if (!str) return '—'
    return str.length > len ? str.slice(0, len) + '…' : str
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.title}>Hash Records</h2>
          <p style={styles.sub}>Most recent 10 hashes generated on the server</p>
        </div>
        <button className="btn-ghost" onClick={load} style={styles.refreshBtn}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={styles.statsRow}>
          <StatPill label="Total Hashes" value={stats.totalHashes ?? 0} />
          {Object.entries(stats.typesCount || {}).map(([type, count]) => (
            <StatPill key={type} label={type.toUpperCase()} value={count} accent />
          ))}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={styles.loadingRow}>
            <span className="spinner" />
            <span style={{ color: 'var(--text)', fontSize: '13px' }}>Loading hashes…</span>
          </div>
        ) : hashes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">#</div>
            <h3 style={{ color: 'var(--text-2)', fontSize: '16px' }}>No hashes yet</h3>
            <p>Upload content from the Upload tab to generate your first hash.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hash (SHA-256)</th>
                <th>Type</th>
                <th>Content ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hashes.map(h => (
                <tr key={h.id} className="fade-up">
                  <td><span className="mono">{truncate(h.id, 12)}</span></td>
                  <td><span className="mono">{truncate(h.hash, 28)}</span></td>
                  <td><span className="badge badge-sha256">{h.type || 'sha256'}</span></td>
                  <td style={{ color: 'var(--text)', fontSize: '12px' }}>
                    {h.contentID || <span style={{ opacity: 0.35 }}>—</span>}
                  </td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(h.id)}>
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

function StatPill({ label, value, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--accent-dim)' : 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(0,232,198,0.2)' : 'var(--border)'}`,
      borderRadius: '8px', padding: '12px 18px',
      display: 'flex', flexDirection: 'column', gap: '2px',
    }}>
      <span style={{ fontSize: '22px', fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--text-bright)' }}>
        {value}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                     letterSpacing: '0.08em', color: 'var(--text)' }}>
        {label}
      </span>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
  topRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: '22px', fontWeight: 700 },
  sub: { fontSize: '14px', color: 'var(--text)', margin: '4px 0 0' },
  refreshBtn: { padding: '8px 16px', fontSize: '13px', flexShrink: 0 },
  statsRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  loadingRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '48px',
  },
}