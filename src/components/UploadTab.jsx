import { useState, useRef } from 'react'
import { contentAPI, hashAPI } from '../api'

// ── Helpers ──────────────────────────────────────────────────────────────────

// Hash an ArrayBuffer using the browser's built-in Web Crypto API
async function hashBuffer(buffer) {
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Read a File as an ArrayBuffer
function readFileAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

// Guess content type from MIME
function mimeToType(mime = '') {
  if (mime.startsWith('image/')) return 'photo'
  if (mime.startsWith('video/')) return 'video'
  return 'text'
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UploadTab({ user }) {
  // 'text' | 'file'
  const [mode, setMode] = useState('file')

  // Shared metadata fields
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [type,        setType]        = useState('photo')

  // Text-mode
  const [textContent, setTextContent] = useState('')

  // File-mode
  const [file,      setFile]      = useState(null)   // File object
  const [dragOver,  setDragOver]  = useState(false)
  const fileInputRef = useRef(null)

  // Shared output
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)

  // ── Mode switch — clear state ──
  function switchMode(m) {
    setMode(m)
    setFile(null)
    setTextContent('')
    setResult(null)
    setError('')
  }

  // ── File selection ──
  function applyFile(f) {
    if (!f) return
    setFile(f)
    if (!name) setName(f.name)
    setType(mimeToType(f.type))
    setError('')
  }

  function onFileInputChange(e) {
    applyFile(e.target.files[0])
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    applyFile(e.dataTransfer.files[0])
  }

  // ── Submit ──
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      let hashHex
      let fileSize = 0

      if (mode === 'file') {
        if (!file) { setError('Please select a file.'); setLoading(false); return }
        const buffer = await readFileAsBuffer(file)
        hashHex  = await hashBuffer(buffer)
        fileSize = file.size
      } else {
        // Hash the text content via the server endpoint
        const hashInput = textContent || `${name}::${type}::${Date.now()}`
        const hashData  = await hashAPI.generate(hashInput, 'sha256')
        if (hashData.error) { setError(hashData.error); return }
        hashHex = hashData.hash
      }

      // Register content record on the server
      const contentPayload = {
        name,
        description,
        type,
        userID:     user?._id,
        uploadDate: new Date().toISOString(),
        metadata: {
          name, description, type,
          size:     mode === 'file' ? fileSize : textContent.length,
          source:   mode === 'file' ? 'file-upload' : 'text-input',
          fileName: mode === 'file' ? file.name   : undefined,
          mimeType: mode === 'file' ? file.type   : undefined,
        },
      }
      const uploaded = await contentAPI.upload(contentPayload)

      // Store the hash record (send the hex string as input so server saves it)
      await hashAPI.generate(hashHex, 'sha256')

      setResult({ content: uploaded, hash: hashHex, source: mode })
      // Reset form
      setName(''); setDescription(''); setType('photo')
      setTextContent(''); setFile(null)
    } catch {
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

  const canSubmit = mode === 'file' ? !!file && !!name : !!name

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={styles.title}>Upload &amp; Hash Content</h2>
        <p style={styles.sub}>
          Register a piece of content. A SHA-256 fingerprint is generated and stored for future verification.
        </p>
      </div>

      <div style={styles.grid}>
        {/* ── Left: form ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Mode toggle */}
          <div style={styles.modeToggle}>
            <button
              type="button"
              onClick={() => switchMode('file')}
              style={{ ...styles.modeBtn, ...(mode === 'file' ? styles.modeBtnActive : {}) }}
            >
              📁 &nbsp;File Upload
            </button>
            <button
              type="button"
              onClick={() => switchMode('text')}
              style={{ ...styles.modeBtn, ...(mode === 'text' ? styles.modeBtnActive : {}) }}
            >
              ✏️ &nbsp;Text / URL
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Shared metadata */}
            <div className="form-group">
              <label>Content Name {mode === 'file' && file ? '' : ''}</label>
              <input
                type="text"
                placeholder={mode === 'file' ? 'Auto-filled from file name' : 'e.g. my-photo-2025.jpg'}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Type</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                  <option value="text">Text / Document</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* ── Text mode ── */}
            {mode === 'text' && (
              <div className="form-group">
                <label>Content / Text to Hash</label>
                <textarea
                  placeholder="Paste text, a URL, or any string that uniquely identifies this content…"
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>
            )}

            {/* ── File mode ── */}
            {mode === 'file' && (
              <div className="form-group">
                <label>File</label>

                {/* Drop zone */}
                <div
                  style={{
                    ...styles.dropZone,
                    ...(dragOver ? styles.dropZoneActive : {}),
                    ...(file     ? styles.dropZoneFilled : {}),
                  }}
                  onClick={() => !file && fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  {file ? (
                    <div style={styles.filePreview}>
                      <span style={styles.fileIcon}>{getFileIcon(file.type)}</span>
                      <div style={styles.fileMeta}>
                        <span style={styles.fileName}>{file.name}</span>
                        <span style={styles.fileSize}>{formatBytes(file.size)} · {file.type || 'unknown type'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setFile(null); setName('') }}
                        style={styles.removeFile}
                        title="Remove file"
                      >✕</button>
                    </div>
                  ) : (
                    <div style={styles.dropPrompt}>
                      <div style={styles.dropIcon}>⬆</div>
                      <div style={styles.dropText}>
                        {dragOver ? 'Drop it!' : 'Drag & drop a file here'}
                      </div>
                      <div style={styles.dropSub}>or <span style={styles.browseLink}>click to browse</span></div>
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={onFileInputChange}
                />

                {file && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ marginTop: '8px', fontSize: '12px', padding: '7px 14px' }}
                  >
                    Change file
                  </button>
                )}
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !canSubmit}
              style={{ width: '100%', padding: '13px', fontSize: '14px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" />
                  {mode === 'file' ? 'Hashing file…' : 'Hashing…'}
                </span>
              ) : (
                mode === 'file' ? '🔒  Hash File & Register' : '⬆  Upload & Generate Hash'
              )}
            </button>
          </form>
        </div>

        {/* ── Right: result ── */}
        <div style={styles.resultCol}>
          {result ? (
            <div className="card fade-up" style={styles.resultCard}>
              <div style={styles.resultHeader}>
                <span style={styles.successDot} />
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>
                  Hash Generated
                </span>
                {result.source === 'file' && (
                  <span className="badge badge-photo" style={{ marginLeft: 'auto' }}>File</span>
                )}
              </div>

              <ResultRow label="Content ID" value={result.content?.contentID} mono />
              <ResultRow label="Name"       value={result.content?.name} />
              <ResultRow label="Type">
                <span className={`badge badge-${result.content?.type}`}>{result.content?.type}</span>
              </ResultRow>
              <ResultRow label="Algorithm">
                <span className="badge badge-sha256">SHA-256</span>
              </ResultRow>

              <div>
                <div style={styles.resultLabel}>SHA-256 Fingerprint</div>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <div className="hash-value">{result.hash}</div>
                  <button onClick={copyHash} className="btn-ghost" style={styles.copyBtn}>
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

          <div style={styles.infoBox}>
            <div style={styles.infoTitle}>How it works</div>
            <ol style={styles.infoList}>
              <li>
                {mode === 'file'
                  ? 'Your file is read locally and hashed in the browser — no raw file data is sent to the server.'
                  : 'Your text or URL is sent to the server to be hashed.'}
              </li>
              <li>A SHA-256 fingerprint (64-char hex) is computed from the file bytes or text.</li>
              <li>The hash and content metadata are stored for future verification.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResultRow({ label, value, mono, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)' }}>
        {label}
      </span>
      {children || (
        <span style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
          {value ?? '—'}
        </span>
      )}
    </div>
  )
}

function getFileIcon(mime = '') {
  if (mime.startsWith('image/')) return '🖼'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime.includes('pdf'))      return '📄'
  return '📁'
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrap:   { display: 'flex', flexDirection: 'column', gap: '28px' },
  header: { display: 'flex', flexDirection: 'column', gap: '6px' },
  title:  { fontSize: '22px', fontWeight: 700 },
  sub:    { fontSize: '14px', color: 'var(--text)', margin: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    alignItems: 'start',
  },

  // Mode toggle
  modeToggle: {
    display: 'flex',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '4px',
    gap: '4px',
  },
  modeBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  modeBtnActive: {
    background: 'var(--surface-3)',
    color: 'var(--text-bright)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  // Drop zone
  dropZone: {
    border: '2px dashed var(--border-2)',
    borderRadius: '10px',
    padding: '28px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'var(--surface-2)',
    textAlign: 'center',
  },
  dropZoneActive: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-dim)',
    boxShadow: '0 0 0 3px var(--accent-glow)',
  },
  dropZoneFilled: {
    cursor: 'default',
    padding: '16px 20px',
    textAlign: 'left',
    borderStyle: 'solid',
    borderColor: 'rgba(0,232,198,0.3)',
    background: 'var(--accent-dim)',
  },
  dropPrompt: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  dropIcon:   { fontSize: '28px', color: 'var(--text)', opacity: 0.4 },
  dropText:   { fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' },
  dropSub:    { fontSize: '12px', color: 'var(--text)' },
  browseLink: { color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' },

  filePreview: { display: 'flex', alignItems: 'center', gap: '12px' },
  fileIcon:    { fontSize: '28px', flexShrink: 0 },
  fileMeta:    { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 },
  fileName:    { fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileSize:    { fontSize: '11px', color: 'var(--text)' },
  removeFile: {
    background: 'none', border: 'none', color: 'var(--text)',
    cursor: 'pointer', fontSize: '14px', padding: '4px', flexShrink: 0,
    lineHeight: 1,
  },

  // Result
  resultCol:    { display: 'flex', flexDirection: 'column', gap: '16px' },
  resultCard:   { display: 'flex', flexDirection: 'column', gap: '14px' },
  emptyResult:  { alignItems: 'center', justifyContent: 'center', minHeight: '220px', textAlign: 'center' },
  resultHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  successDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--success)', boxShadow: '0 0 8px var(--success)',
  },
  resultLabel: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)' },
  copyBtn: {
    position: 'absolute', top: '8px', right: '8px',
    padding: '4px 10px', fontSize: '11px',
    background: 'var(--surface-3)', border: '1px solid var(--border-2)', color: 'var(--text-2)',
  },
  infoBox: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '18px 20px',
  },
  infoTitle: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--text)', marginBottom: '10px',
  },
  infoList: { margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' },
}