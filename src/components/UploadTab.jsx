import { useState } from 'react'
import { contentAPI, hashAPI } from '../api'

export default function UploadTab({ user }) {
  const [form, setForm] = useState({
    name: '', description: '', type: 'photo', content: '',
  })
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      // 1. Upload the content record
      const contentPayload = {
        name:        form.name,
        description: form.description,
        type:        form.type,
        userID:      user?._id,
        uploadDate:  new Date().toISOString(),
        metadata: {
          name:        form.name,
          description: form.description,
          type:        form.type,
          size:        form.content.length,
        },
      }
      const uploaded = await contentAPI.upload(contentPayload)

      // 2. Generate hash from the content text
      const hashInput = form.content || `${form.name}::${form.type}::${Date.now()}`
      const hashData  = await hashAPI.generate(hashInput, 'sha256')

      if (hashData.error) {
        setError(hashData.error)
        return
      }

      setResult({ content: uploaded, hash: hashData.hash })
      setForm({ name: '', description: '', type: 'photo', content: '' })
    } catch (err) {
      setError('Failed to reach the server. Is it running on port 3000?')
    } finally {
      setLoading(false)
    }
  }

  function copyHash() {
    if (!result?.hash) return
    navigator.clipboard.writeText(result.hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={styles.title}>Upload & Hash Content</h2>
        <p style={styles.sub}>
          Register a piece of content. A SHA-256 fingerprint is generated and stored for future verification.
        </p>
      </div>

      <div style={styles.grid}>
        {/* ── Form ── */}
        <div className="card" style={styles.formCard}>
          <form onSubmit={handleSubmit} style={styles.form}>

            <div className="form-group">
              <label>Content Name</label>
              <input type="text" placeholder="e.g. my-photo-2025.jpg"
                     value={form.name} onChange={update('name')} required />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={update('type')}>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="text">Text / Document</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input type="text" placeholder="Short description of the content"
                     value={form.description} onChange={update('description')} />
            </div>

            <div className="form-group">
              <label>Content / Text to Hash</label>
              <textarea
                placeholder="Paste text, a URL, a file path, or any string that uniquely identifies this content…"
                value={form.content}
                onChange={update('content')}
                style={{ minHeight: '120px' }}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}
                    style={{ width: '100%', padding: '13px', fontSize: '14px' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" /> Hashing…
                </span>
              ) : '⬆  Upload & Generate Hash'}
            </button>
          </form>
        </div>

        {/* ── Result ── */}
        <div style={styles.resultCol}>
          {result ? (
            <div className="card fade-up" style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <span style={styles.successDot} />
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>
                  Hash Generated
                </span>
              </div>

              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Content ID</span>
                <span style={styles.resultValue}>{result.content?.contentID}</span>
              </div>

              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Name</span>
                <span style={styles.resultValue}>{result.content?.name}</span>
              </div>

              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Type</span>
                <span className={`badge badge-${result.content?.type}`}>
                  {result.content?.type}
                </span>
              </div>

              <div style={styles.resultRow}>
                <span style={styles.resultLabel}>Algorithm</span>
                <span className="badge badge-sha256">SHA-256</span>
              </div>

              <div style={{ marginTop: '4px' }}>
                <div style={styles.resultLabel}>SHA-256 Fingerprint</div>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <div className="hash-value">{result.hash}</div>
                  <button onClick={copyHash} className="btn-ghost"
                          style={styles.copyBtn}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ ...styles.resultCard, ...styles.emptyResult }}>
              <div style={{ fontSize: '40px', opacity: 0.2 }}>🔒</div>
              <p style={{ color: 'var(--text)', fontSize: '13px', margin: '10px 0 0' }}>
                Your hash fingerprint will appear here after upload.
              </p>
            </div>
          )}

          {/* Info box */}
          <div style={styles.infoBox}>
            <div style={styles.infoTitle}>How it works</div>
            <ol style={styles.infoList}>
              <li>Your content metadata is registered on the server.</li>
              <li>A SHA-256 hash of the content string is computed.</li>
              <li>The fingerprint is stored and can be verified later.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '28px' },
  header: { display: 'flex', flexDirection: 'column', gap: '6px' },
  title: { fontSize: '22px', fontWeight: 700 },
  sub: { fontSize: '14px', color: 'var(--text)', margin: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  formCard: { display: 'flex', flexDirection: 'column', gap: '0' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  resultCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  resultCard: { display: 'flex', flexDirection: 'column', gap: '14px' },
  emptyResult: { alignItems: 'center', justifyContent: 'center', minHeight: '220px', textAlign: 'center' },
  resultHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  successDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--success)',
    boxShadow: '0 0 8px var(--success)',
  },
  resultRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  resultLabel: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)' },
  resultValue: { fontSize: '13px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' },
  copyBtn: {
    position: 'absolute', top: '8px', right: '8px',
    padding: '4px 10px', fontSize: '11px',
    background: 'var(--surface-3)', border: '1px solid var(--border-2)',
    color: 'var(--text-2)',
  },
  infoBox: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
  },
  infoTitle: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--text)', marginBottom: '10px',
  },
  infoList: {
    margin: 0, paddingLeft: '18px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
}