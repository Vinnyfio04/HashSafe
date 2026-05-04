import { useState, useRef } from 'react'
import { hashAPI } from '../api'

// ── Helpers (same as UploadTab) ───────────────────────────────────────────────

async function hashBuffer(buffer) {
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function readFileAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getFileIcon(mime = '') {
  if (mime.startsWith('image/')) return '🖼'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime.includes('pdf'))      return '📄'
  return '📁'
}

// ── SelectableHash ────────────────────────────────────────────────────────────
// A read-only input that auto-selects all text on click — most reliable
// cross-browser way to let users copy a hash without clipboard API issues.

function SelectableHash({ hash, onSendToVerify }) {
  const inputRef = useRef(null)

  function handleClick() {
    inputRef.current?.select()
  }

  return (
    <div style={sh.wrap}>
      <div style={sh.label}>SHA-256 Hash — click to select, then copy</div>
      <div style={sh.row}>
        <input
          ref={inputRef}
          readOnly
          value={hash}
          onClick={handleClick}
          style={sh.input}
          spellCheck={false}
        />
        {onSendToVerify && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => onSendToVerify(hash)}
            style={sh.sendBtn}
          >
            Verify →
          </button>
        )}
      </div>
      <div style={sh.hint}>💡 Click the field to select all, then Ctrl+C / ⌘+C to copy</div>
    </div>
  )
}

const sh = {
  wrap:    { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px' },
  label:   { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)' },
  row:     { display: 'flex', gap: '8px', alignItems: 'stretch' },
  input: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(0,232,198,0.25)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    cursor: 'text',
    outline: 'none',
    letterSpacing: '0.04em',
    userSelect: 'all',
  },
  sendBtn: { flexShrink: 0, padding: '10px 16px', fontSize: '13px' },
  hint:    { fontSize: '11px', color: 'var(--text)', opacity: 0.7 },
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VerifyTab() {
  // Step 1 — generate hash
  const [genMode,    setGenMode]    = useState('file') // 'file' | 'text'
  const [file,       setFile]       = useState(null)
  const [dragOver,   setDragOver]   = useState(false)
  const [textInput,  setTextInput]  = useState('')
  const [genHash,    setGenHash]    = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError,   setGenError]   = useState('')
  const fileInputRef = useRef(null)

  // Step 2 — verify hash
  const [verifyInput, setVerifyInput] = useState('')
  const [result,      setResult]      = useState(null) // 'found' | 'not-found' | null
  const [record,      setRecord]      = useState(null)
  const [verifying,   setVerifying]   = useState(false)
  const [verifyError, setVerifyError] = useState('')

  // ── Step 1: file handling ──
  function applyFile(f) {
    if (!f) return
    setFile(f)
    setGenHash('')
    setGenError('')
  }

  function onFileInputChange(e) {
    applyFile(e.target.files[0])
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    applyFile(e.dataTransfer.files[0])
  }

  function switchGenMode(m) {
    setGenMode(m)
    setFile(null)
    setTextInput('')
    setGenHash('')
    setGenError('')
  }

  // ── Step 1: generate ──
  async function handleGenerate(e) {
    e.preventDefault()
    setGenHash('')
    setGenError('')
    setGenLoading(true)

    try {
      if (genMode === 'file') {
        if (!file) { setGenError('Please select a file.'); return }
        const buffer = await readFileAsBuffer(file)
        const hex    = await hashBuffer(buffer)
        setGenHash(hex)
      } else {
        if (!textInput.trim()) { setGenError('Please enter some text.'); return }
        const encoded = new TextEncoder().encode(textInput.trim())
        const hex = await hashBuffer(encoded)
        setGenHash(hex)
      }
    } catch {
      setGenError('Something went wrong. Try again.')
    } finally {
      setGenLoading(false)
    }
  }

  function sendToVerify(hash) {
    setVerifyInput(hash)
    setResult(null)
    setRecord(null)
    setVerifyError('')
    // Small delay so the user sees it land
    setTimeout(() => {
      document.getElementById('verify-input')?.focus()
    }, 100)
  }

  // ── Step 2: verify ──
  async function handleVerify(e) {
    e.preventDefault()
    const val = verifyInput.trim()
    if (!val) return
    setVerifying(true)
    setResult(null)
    setRecord(null)
    setVerifyError('')

    try {
      const res  = await fetch(`http://localhost:3000/hash/${encodeURIComponent(val)}/value`)
      const data = await res.json()
      if (data.error || res.status === 404) {
        setResult('not-found')
      } else {
        setResult('found')
        setRecord(data)
      }
    } catch {
      setVerifyError('Could not reach server.')
    } finally {
      setVerifying(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      <div>
        <h2 style={styles.title}>Verify Integrity</h2>
        <p style={styles.sub}>
          Generate a hash from a file or text, then check it against the HashSafe database.
        </p>
      </div>

      <div style={styles.grid}>

        {/* ══════════ LEFT — Step 1: Generate ══════════ */}
        <div style={styles.col}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.stepLabel}>Step 1 — Generate a hash</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
              Upload the file or paste the text you want to verify. We'll compute its SHA-256 fingerprint.
            </p>

            {/* Mode toggle */}
            <div style={styles.modeToggle}>
              <button type="button" onClick={() => switchGenMode('file')}
                      style={{ ...styles.modeBtn, ...(genMode === 'file' ? styles.modeBtnActive : {}) }}>
                📁 File
              </button>
              <button type="button" onClick={() => switchGenMode('text')}
                      style={{ ...styles.modeBtn, ...(genMode === 'text' ? styles.modeBtnActive : {}) }}>
                ✏️ Text
              </button>
            </div>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* File mode */}
              {genMode === 'file' && (
                <>
                  <div
                    style={{ ...styles.dropZone, ...(dragOver ? styles.dropZoneActive : {}),
                             ...(file ? styles.dropZoneFilled : {}) }}
                    onClick={() => !file && fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                  >
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{getFileIcon(file.type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text)' }}>
                            {formatBytes(file.size)} · {file.type || 'unknown'}
                          </div>
                        </div>
                        <button type="button"
                                onClick={e => { e.stopPropagation(); setFile(null); setGenHash('') }}
                                style={styles.removeBtn}>✕</button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '26px', opacity: 0.4, marginBottom: '6px' }}>⬆</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                          {dragOver ? 'Drop it!' : 'Drag & drop or click to browse'}
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                         onChange={onFileInputChange} />
                </>
              )}

              {/* Text mode */}
              {genMode === 'text' && (
                <div className="form-group">
                  <label>Text / URL</label>
                  <textarea
                    placeholder="Paste the original text or URL you want to fingerprint…"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    style={{ minHeight: '100px' }}
                  />
                </div>
              )}

              {genError && <div className="alert alert-error">{genError}</div>}

              <button type="submit" className="btn-primary" disabled={genLoading || (genMode === 'file' ? !file : !textInput.trim())}
                      style={{ width: '100%', padding: '12px' }}>
                {genLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="spinner" /> Hashing…
                    </span>
                  : '# Compute Hash'}
              </button>
            </form>

            {/* Generated hash — selectable input */}
            {genHash && (
              <div className="fade-up">
                <SelectableHash hash={genHash} onSendToVerify={sendToVerify} />
              </div>
            )}
          </div>

          <div style={styles.tip}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-strong)' }}>How it works: </strong>
              SHA-256 is deterministic — the same file always produces the same 64-character fingerprint.
              If it matches what's in the database, your content is unchanged.
            </p>
          </div>
        </div>

        {/* ══════════ RIGHT — Step 2: Verify ══════════ */}
        <div style={styles.col}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={styles.stepLabel}>Step 2 — Look up in database</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
              Paste or send a SHA-256 hash here to check if it was registered in HashSafe.
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>SHA-256 Hash</label>
                <textarea
                  id="verify-input"
                  placeholder="Paste a 64-character hex hash, or hit 'Verify →' from Step 1…"
                  value={verifyInput}
                  onChange={e => setVerifyInput(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', minHeight: '96px' }}
                />
              </div>

              {verifyError && <div className="alert alert-error">{verifyError}</div>}

              <button type="submit" className="btn-primary"
                      disabled={verifying || !verifyInput.trim()}
                      style={{ width: '100%', padding: '12px' }}>
                {verifying ? <span className="spinner" /> : '✓  Verify Hash'}
              </button>
            </form>

            {/* Result: found */}
            {result === 'found' && (
              <div className="fade-up" style={styles.foundBox}>
                <div style={styles.resultHeader}>
                  <span style={styles.dotGreen} />
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>
                    Hash Verified ✓
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: '4px 0 12px' }}>
                  This fingerprint exists in the database — content is authentic.
                </p>
                {record && (
                  <>
                    <InfoRow label="Record ID"  value={record.id}        mono />
                    <InfoRow label="Type"        value={record.type} />
                    <InfoRow label="Content ID"  value={record.contentID || '—'} />
                  </>
                )}
              </div>
            )}

            {/* Result: not found */}
            {result === 'not-found' && (
              <div className="fade-up" style={styles.notFoundBox}>
                <div style={styles.resultHeader}>
                  <span style={styles.dotRed} />
                  <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '14px' }}>
                    Not Found
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text)', margin: '6px 0 0' }}>
                  This hash is not registered in HashSafe. The content may be unverified or tampered with.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                     letterSpacing: '0.08em', color: 'var(--text)' }}>
        {label}
      </span>
      <span style={{ fontSize: '12px', color: 'var(--text-2)',
                     fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
        {value || '—'}
      </span>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrap:  { display: 'flex', flexDirection: 'column', gap: '24px' },
  title: { fontSize: '22px', fontWeight: 700 },
  sub:   { fontSize: '14px', color: 'var(--text)', margin: '6px 0 0' },
  grid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' },
  col:   { display: 'flex', flexDirection: 'column', gap: '16px' },

  stepLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--accent)',
  },

  modeToggle: {
    display: 'flex', background: 'var(--surface-2)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '4px', gap: '4px',
  },
  modeBtn: {
    flex: 1, background: 'none', border: 'none', color: 'var(--text)',
    padding: '7px 12px', borderRadius: '6px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  },
  modeBtnActive: {
    background: 'var(--surface-3)', color: 'var(--text-bright)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  dropZone: {
    border: '2px dashed var(--border-2)', borderRadius: '10px',
    padding: '24px 16px', cursor: 'pointer', transition: 'all 0.2s',
    background: 'var(--surface-2)',
  },
  dropZoneActive: {
    borderColor: 'var(--accent)', background: 'var(--accent-dim)',
    boxShadow: '0 0 0 3px var(--accent-glow)',
  },
  dropZoneFilled: {
    cursor: 'default', padding: '14px 16px',
    borderStyle: 'solid', borderColor: 'rgba(0,232,198,0.3)',
    background: 'var(--accent-dim)',
  },
  removeBtn: {
    background: 'none', border: 'none', color: 'var(--text)',
    cursor: 'pointer', fontSize: '13px', padding: '4px', lineHeight: 1, flexShrink: 0,
  },

  tip: {
    display: 'flex', gap: '12px', alignItems: 'flex-start',
    padding: '14px 16px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
  },

  foundBox: {
    marginTop: '4px', padding: '16px',
    background: 'var(--success-dim)', border: '1px solid rgba(34,217,122,0.25)',
    borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0',
  },
  notFoundBox: {
    marginTop: '4px', padding: '16px',
    background: 'var(--danger-dim)', border: '1px solid rgba(255,78,106,0.25)',
    borderRadius: 'var(--radius)',
  },
  resultHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' },
  dotGreen: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' },
  dotRed:   { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)',  boxShadow: '0 0 6px var(--danger)' },
}