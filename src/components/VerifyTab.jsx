import { useState } from 'react'
import { hashAPI } from '../api'

export default function VerifyTab() {
  const [input,   setInput]   = useState('')
  const [result,  setResult]  = useState(null)   // 'found' | 'not-found' | null
  const [record,  setRecord]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Also allow generating a hash from text for comparison
  const [genInput,  setGenInput]  = useState('')
  const [genHash,   setGenHash]   = useState('')
  const [genLoading, setGenLoading] = useState(false)

  async function handleVerify(e) {
    e.preventDefault()
    const val = input.trim()
    if (!val) return
    setLoading(true)
    setResult(null)
    setRecord(null)
    setError('')

    try {
      // Search by hash value using GET /hash/:hash/value
      const res = await fetch(`http://localhost:3000/hash/${encodeURIComponent(val)}/value`)
      const data = await res.json()
      if (data.error || res.status === 404) {
        setResult('not-found')
      } else {
        setResult('found')
        setRecord(data)
      }
    } catch {
      setError('Could not reach server.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!genInput.trim()) return
    setGenLoading(true)
    setGenHash('')
    try {
      const data = await hashAPI.generate(genInput.trim(), 'sha256')
      if (data.hash) setGenHash(data.hash)
    } catch {
      // silently fail
    } finally {
      setGenLoading(false)
    }
  }

  function copyToVerify(hash) {
    setInput(hash)
  }

  return (
    <div style={styles.wrap}>
      <div>
        <h2 style={styles.title}>Verify Integrity</h2>
        <p style={styles.sub}>
          Paste a SHA-256 hash to check whether it was registered in the HashSafe database.
        </p>
      </div>

      <div style={styles.grid}>
        {/* ── Verify panel ── */}
        <div style={styles.col}>
          <div className="card">
            <div style={styles.sectionLabel}>Step 2 — Look up a hash</div>
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div className="form-group">
                <label>SHA-256 Hash</label>
                <textarea
                  placeholder="Paste a 64-character hex hash…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', minHeight: '80px' }}
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading || !input.trim()}
                      style={{ width: '100%', padding: '13px' }}>
                {loading ? <span className="spinner" /> : '✓  Verify Hash'}
              </button>
            </form>

            {/* Result */}
            {result === 'found' && (
              <div className="fade-up" style={styles.foundBox}>
                <div style={styles.foundHeader}>
                  <span style={styles.dot_green} />
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>Hash Verified ✓</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 12px' }}>
                  This hash exists in the database.
                </p>
                {record && (
                  <>
                    <InfoRow label="Record ID"  value={record.id} mono />
                    <InfoRow label="Type"       value={record.type} />
                    <InfoRow label="Content ID" value={record.contentID || '—'} />
                    <div style={{ marginTop: '10px' }}>
                      <div style={styles.rowLabel}>Hash</div>
                      <div className="hash-value" style={{ marginTop: '6px' }}>{record.hash}</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {result === 'not-found' && (
              <div className="fade-up" style={styles.notFoundBox}>
                <div style={styles.foundHeader}>
                  <span style={styles.dot_red} />
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Not Found</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: '6px 0 0' }}>
                  This hash is not registered in the database. The content may be unverified or tampered with.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Generate hash to compare ── */}
        <div style={styles.col}>
          <div className="card">
            <div style={styles.sectionLabel}>Step 1 — Generate a hash to compare</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: '8px 0 14px' }}>
              Re-hash the content you want to verify and compare it against the stored fingerprint.
            </p>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Content string</label>
                <textarea
                  placeholder="Paste the original text / identifier you hashed…"
                  value={genInput}
                  onChange={e => setGenInput(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>
              <button type="submit" className="btn-ghost" disabled={genLoading || !genInput.trim()}>
                {genLoading ? <span className="spinner" /> : '# Generate Hash'}
              </button>
            </form>

            {genHash && (
              <div className="fade-up" style={{ marginTop: '16px' }}>
                <div style={styles.rowLabel}>Result</div>
                <div className="hash-value" style={{ marginTop: '6px' }}>{genHash}</div>
                <button
                  className="btn-ghost"
                  onClick={() => copyToVerify(genHash)}
                  style={{ marginTop: '10px', width: '100%', fontSize: '12px' }}
                >
                  ← Send to Verify
                </button>
              </div>
            )}
          </div>

          <div style={styles.tip}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--text-strong)' }}>Tip: </strong>
              SHA-256 is deterministic — the same input always produces the same 64-character hex output.
              If your re-generated hash matches the stored one, the content is unchanged.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', padding: '6px 0',
                  borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                     letterSpacing: '0.08em', color: 'var(--text)' }}>{label}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-2)',
                     fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
        {value || '—'}
      </span>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '24px' },
  title: { fontSize: '22px', fontWeight: 700 },
  sub: { fontSize: '14px', color: 'var(--text)', margin: '6px 0 0' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' },
  col: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--accent)',
  },
  rowLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text)',
  },
  foundBox: {
    marginTop: '18px', padding: '16px',
    background: 'var(--success-dim)', border: '1px solid rgba(34,217,122,0.25)',
    borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0',
  },
  notFoundBox: {
    marginTop: '18px', padding: '16px',
    background: 'var(--danger-dim)', border: '1px solid rgba(255,78,106,0.25)',
    borderRadius: 'var(--radius)',
  },
  foundHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
  dot_green: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' },
  dot_red:   { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)',  boxShadow: '0 0 6px var(--danger)' },
  tip: {
    display: 'flex', gap: '12px', alignItems: 'flex-start',
    padding: '14px 16px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  },
}