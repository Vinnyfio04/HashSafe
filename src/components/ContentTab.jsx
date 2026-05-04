import { useState, useEffect, useCallback } from 'react'
import { contentAPI, hashAPI } from '../api'

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
                <th>Hash</th>
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
                  <td style={{ maxWidth: '160px', color: 'var(--text)' }}>
                    {item.description
                      ? item.description.length > 36
                        ? item.description.slice(0, 36) + '…'
                        : item.description
                      : <span style={{ opacity: 0.35 }}>—</span>}
                  </td>
                  <td style={{ fontSize: '12px' }}>{formatDate(item.uploadDate)}</td>
                  <td><span className="mono">{String(item.contentID).slice(0, 12)}</span></td>
                  <td>
                    <CopyHashButton contentId={item.contentID} />
                  </td>
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

// ── CopyHashButton ────────────────────────────────────────────────────────────
// Fetches the hash for a content item on first click, then copies it.
// States: idle → loading → copied / error

function CopyHashButton({ contentId }) {
  const [state, setState] = useState('idle')   // idle | loading | copied | error
  const [hash,  setHash]  = useState(null)
  const [tip,   setTip]   = useState(false)    // tooltip visible

  async function handleClick() {
    // If we already have the hash just copy it again
    if (hash) {
      navigator.clipboard.writeText(hash)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
      return
    }

    setState('loading')
    try {
      const data = await hashAPI.getByContentId(contentId)
      // The endpoint returns an array of hash records
      const record = Array.isArray(data) ? data[0] : data
      if (!record || !record.hash) {
        setState('error')
        setTimeout(() => setState('idle'), 2500)
        return
      }
      setHash(record.hash)
      navigator.clipboard.writeText(record.hash)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  const label = {
    idle:    'Copy Hash',
    loading: <span className="spinner" style={{ width: '12px', height: '12px' }} />,
    copied:  '✓ Copied',
    error:   'No Hash Found',
  }[state]

  const btnStyle = {
    ...styles.copyBtn,
    ...(state === 'copied' ? styles.copyBtnCopied  : {}),
    ...(state === 'error'  ? styles.copyBtnError   : {}),
    ...(state === 'loading' ? { opacity: 0.7, cursor: 'default' } : {}),
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
         onMouseEnter={() => hash && setTip(true)}
         onMouseLeave={() => setTip(false)}>
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        style={btnStyle}
      >
        {label}
      </button>

      {/* Tooltip showing truncated hash on hover after first fetch */}
      {tip && hash && (
        <div style={styles.tooltip}>
          {hash.slice(0, 20)}…{hash.slice(-8)}
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrap:    { display: 'flex', flexDirection: 'column', gap: '20px' },
  topRow:  { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:   { fontSize: '22px', fontWeight: 700 },
  sub:     { fontSize: '14px', color: 'var(--text)', margin: '4px 0 0' },
  refreshBtn: { padding: '8px 16px', fontSize: '13px', flexShrink: 0 },
  searchRow:  { display: 'flex', gap: '10px' },
  loadingRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '48px',
  },

  copyBtn: {
    fontFamily: 'var(--font-ui)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(0,232,198,0.3)',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
  },
  copyBtnCopied: {
    background: 'var(--success-dim)',
    border: '1px solid rgba(34,217,122,0.3)',
    color: 'var(--success)',
  },
  copyBtnError: {
    background: 'var(--danger-dim)',
    border: '1px solid rgba(255,78,106,0.3)',
    color: 'var(--danger)',
  },

  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 6px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--surface-3)',
    border: '1px solid var(--border-2)',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent-text)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
}