import { useState, useRef } from 'react'
import { contentAPI, hashAPI } from '../api'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getFileIcon(mime = '') {
  if (mime.startsWith('image/')) return '🖼'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime.includes('pdf'))      return '📄'
  return '📁'
}

let idCounter = 0
function makeQueueItem(file) {
  return {
    id:       ++idCounter,
    file,
    name:     file.name,
    type:     mimeToType(file.type),
    status:   'pending', // pending | hashing | done | error
    hash:     null,
    contentId: null,
    errorMsg:  null,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UploadTab({ user }) {
  const [mode, setMode] = useState('file') // 'file' | 'text'

  // File mode — queue of items
  const [queue,    setQueue]    = useState([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Text mode
  const [textName,    setTextName]    = useState('')
  const [textDesc,    setTextDesc]    = useState('')
  const [textType,    setTextType]    = useState('photo')
  const [textContent, setTextContent] = useState('')
  const [textResult,  setTextResult]  = useState(null)

  // Shared
  const [processing, setProcessing] = useState(false)
  const [error,      setError]      = useState('')

  // ── Mode switch ──
  function switchMode(m) {
    setMode(m)
    setError('')
    setTextResult(null)
  }

  // ── Queue management ──
  function addFiles(fileList) {
    const newItems = Array.from(fileList).map(makeQueueItem)
    setQueue(q => [...q, ...newItems])
    setError('')
  }

  function removeFromQueue(id) {
    setQueue(q => q.filter(item => item.id !== id))
  }

  function clearQueue() {
    setQueue([])
    setError('')
  }

  function updateItem(id, patch) {
    setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  function onFileInputChange(e) {
    if (e.target.files.length) addFiles(e.target.files)
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  // ── Process the queue ──
  async function handleBatchSubmit(e) {
    e.preventDefault()
    const pending = queue.filter(item => item.status === 'pending')
    if (!pending.length) return
    setProcessing(true)
    setError('')

    for (const item of pending) {
      updateItem(item.id, { status: 'hashing' })
      try {
        const buffer  = await readFileAsBuffer(item.file)
        const hashHex = await hashBuffer(buffer)

        const uploaded = await contentAPI.upload({
          name:       item.name,
          description: '',
          type:       item.type,
          userID:     user?._id,
          uploadDate: new Date().toISOString(),
          metadata: {
            name: item.name, type: item.type,
            size: item.file.size, source: 'file-upload',
            fileName: item.file.name, mimeType: item.file.type,
          },
        })

        await hashAPI.generate(hashHex, 'sha256', uploaded?.contentID)

        updateItem(item.id, {
          status:    'done',
          hash:      hashHex,
          contentId: uploaded?.contentID ?? null,
        })
      } catch {
        updateItem(item.id, { status: 'error', errorMsg: 'Failed to process' })
      }
    }
    setProcessing(false)
  }

  // ── Text mode submit ──
  async function handleTextSubmit(e) {
    e.preventDefault()
    setError('')
    setTextResult(null)
    setProcessing(true)
    try {
      // Upload content first so we have the contentID to link the hash to
      const uploaded = await contentAPI.upload({
        name: textName, description: textDesc, type: textType,
        userID: user?._id, uploadDate: new Date().toISOString(),
        metadata: { name: textName, description: textDesc, type: textType,
                    size: textContent.length, source: 'text-input' },
      })

      const hashInput = textContent || `${textName}::${textType}::${Date.now()}`
      const hashData  = await hashAPI.generate(hashInput, 'sha256', uploaded?.contentID)
      if (hashData.error) { setError(hashData.error); return }

      setTextResult({ hash: hashData.hash, content: uploaded })
      setTextName(''); setTextDesc(''); setTextContent(''); setTextType('photo')
    } catch {
      setError('Failed to reach the server. Is it running on port 3000?')
    } finally {
      setProcessing(false)
    }
  }

  // ── Derived counts ──
  const pendingCount = queue.filter(i => i.status === 'pending').length
  const doneCount    = queue.filter(i => i.status === 'done').length
  const errorCount   = queue.filter(i => i.status === 'error').length
  const hasQueue     = queue.length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={styles.title}>Upload &amp; Hash Content</h2>
        <p style={styles.sub}>
          Generate SHA-256 fingerprints for your files. Batch upload multiple files at once.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={styles.modeToggle}>
        <button type="button" onClick={() => switchMode('file')}
                style={{ ...styles.modeBtn, ...(mode === 'file' ? styles.modeBtnActive : {}) }}>
          📁 &nbsp;File Upload
        </button>
        <button type="button" onClick={() => switchMode('text')}
                style={{ ...styles.modeBtn, ...(mode === 'text' ? styles.modeBtnActive : {}) }}>
          ✏️ &nbsp;Text / URL
        </button>
      </div>

      {/* ══════════════ FILE MODE ══════════════ */}
      {mode === 'file' && (
        <div style={styles.twoCol}>

          {/* Left: drop zone + queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div
              style={{ ...styles.dropZone, ...(dragOver ? styles.dropZoneActive : {}) }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div style={styles.dropPrompt}>
                <div style={{ fontSize: '32px', color: 'var(--accent)', opacity: 0.6 }}>⬆</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-2)' }}>
                  {dragOver ? 'Release to add files' : 'Drag & drop files here'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                  or <span style={styles.browseLink}>click to browse</span> — select multiple at once
                </div>
              </div>
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                   onChange={onFileInputChange} />

            {/* Queue */}
            {hasQueue && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={styles.panelHeader}>
                  <span style={styles.panelTitle}>
                    Queue &nbsp;<span style={{ color: 'var(--accent)' }}>{queue.length}</span>
                  </span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {doneCount  > 0 && <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)' }}>✓ {doneCount}</span>}
                    {errorCount > 0 && <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)'  }}>✕ {errorCount}</span>}
                    <button type="button" className="btn-ghost" onClick={clearQueue}
                            style={{ padding: '4px 10px', fontSize: '11px' }}>
                      Clear all
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {queue.map(item => (
                    <QueueRow key={item.id} item={item} onRemove={() => removeFromQueue(item.id)} />
                  ))}
                </div>
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <button
              className="btn-primary"
              onClick={handleBatchSubmit}
              disabled={processing || pendingCount === 0}
              style={{ width: '100%', padding: '13px', fontSize: '14px' }}
            >
              {processing ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" /> Processing files…
                </span>
              ) : pendingCount > 0
                  ? `🔒  Hash & Register ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`
                  : hasQueue ? '✓  All files processed' : 'Add files above to begin'
              }
            </button>
          </div>

          {/* Right: results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {doneCount > 0 ? (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={styles.panelHeader}>
                  <span style={styles.panelTitle}>Results</span>
                  <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                    {doneCount} hash{doneCount !== 1 ? 'es' : ''} generated
                  </span>
                </div>
                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  {queue.filter(i => i.status === 'done').map(item => (
                    <ResultEntry key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={styles.emptyPanel}>
                <div style={{ fontSize: '36px', opacity: 0.2 }}>🔒</div>
                <p style={{ color: 'var(--text)', fontSize: '13px', margin: '8px 0 0' }}>
                  Hashed files will appear here.
                </p>
              </div>
            )}
            <InfoBox mode="file" />
          </div>
        </div>
      )}

      {/* ══════════════ TEXT MODE ══════════════ */}
      {mode === 'text' && (
        <div style={styles.twoCol}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Content Name</label>
                <input type="text" placeholder="e.g. my-document.txt"
                       value={textName} onChange={e => setTextName(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Type</label>
                  <select value={textType} onChange={e => setTextType(e.target.value)}>
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                    <option value="text">Text / Document</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" placeholder="Optional"
                         value={textDesc} onChange={e => setTextDesc(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Content / Text to Hash</label>
                <textarea placeholder="Paste text, a URL, or any string…"
                          value={textContent} onChange={e => setTextContent(e.target.value)}
                          style={{ minHeight: '120px' }} />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="btn-primary" disabled={processing || !textName}
                      style={{ width: '100%', padding: '13px', fontSize: '14px' }}>
                {processing
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="spinner" /> Hashing…
                    </span>
                  : '⬆  Upload & Generate Hash'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {textResult ? (
              <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.successDot} />
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>Hash Generated</span>
                </div>
                <LabelValue label="Content ID" value={textResult.content?.contentID} mono />
                <LabelValue label="Name"       value={textResult.content?.name} />
                <LabelValue label="Algorithm">
                  <span className="badge badge-sha256">SHA-256</span>
                </LabelValue>
                <div>
                  <div style={styles.rowLabel}>SHA-256 Fingerprint</div>
                  <CopyableHash hash={textResult.hash} />
                </div>
              </div>
            ) : (
              <div className="card" style={styles.emptyPanel}>
                <div style={{ fontSize: '36px', opacity: 0.2 }}>🔒</div>
                <p style={{ color: 'var(--text)', fontSize: '13px', margin: '8px 0 0' }}>
                  Your hash fingerprint will appear here.
                </p>
              </div>
            )}
            <InfoBox mode="text" />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Queue row ─────────────────────────────────────────────────────────────────

function QueueRow({ item, onRemove }) {
  const statusColor = { pending: 'var(--text)', hashing: 'var(--warning)', done: 'var(--success)', error: 'var(--danger)' }
  const statusLabel = { pending: 'Pending', hashing: '…', done: 'Done', error: 'Error' }

  return (
    <div style={styles.queueRow}>
      <span style={{ fontSize: '20px', flexShrink: 0 }}>{getFileIcon(item.file.type)}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)',
                       overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text)' }}>
          {formatBytes(item.file.size)} · {item.file.type || 'unknown'}
        </span>
        {item.status === 'done' && item.hash && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent-text)',
                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.hash.slice(0, 36)}…
          </span>
        )}
        {item.status === 'error' && (
          <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{item.errorMsg}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {item.status === 'hashing'
          ? <span className="spinner" style={{ width: '13px', height: '13px' }} />
          : <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor[item.status] }}>
              {statusLabel[item.status]}
            </span>
        }
        {item.status === 'pending' && (
          <button onClick={onRemove}
                  style={{ background: 'none', border: 'none', color: 'var(--text)',
                           cursor: 'pointer', fontSize: '13px', padding: '2px 4px', lineHeight: 1 }}>
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// ── Result entry ──────────────────────────────────────────────────────────────

function ResultEntry({ item }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(item.hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px',
                  borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{getFileIcon(item.file.type)}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)', flex: 1,
                       minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>
        <button onClick={copy} className="btn-ghost"
                style={{ padding: '3px 10px', fontSize: '11px', flexShrink: 0 }}>
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent-text)',
                    wordBreak: 'break-all', lineHeight: 1.7, padding: '8px 10px',
                    background: 'var(--accent-dim)', borderRadius: '6px',
                    border: '1px solid rgba(0,232,198,0.15)' }}>
        {item.hash}
      </div>
    </div>
  )
}

// ── Misc ──────────────────────────────────────────────────────────────────────

function CopyableHash({ hash }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <div className="hash-value">{hash}</div>
      <button
        onClick={() => { navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="btn-ghost"
        style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 10px', fontSize: '11px',
                 background: 'var(--surface-3)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}>
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

function LabelValue({ label, value, mono, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                     textTransform: 'uppercase', color: 'var(--text)' }}>
        {label}
      </span>
      {children || (
        <span style={{ fontSize: '13px', color: 'var(--text-2)',
                       fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
          {value ?? '—'}
        </span>
      )}
    </div>
  )
}

function InfoBox({ mode }) {
  return (
    <div style={styles.infoBox}>
      <div style={styles.infoTitle}>How it works</div>
      <ol style={styles.infoList}>
        {mode === 'file' ? <>
          <li>Add one or more files via drag-and-drop or the file browser.</li>
          <li>Each file is read and hashed in your browser — no raw data is sent to the server.</li>
          <li>The SHA-256 fingerprint and metadata are stored for later verification.</li>
        </> : <>
          <li>Enter a name and the text or URL you want to fingerprint.</li>
          <li>The server computes a SHA-256 hash of the input string.</li>
          <li>The fingerprint is stored and can be verified later.</li>
        </>}
      </ol>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrap:   { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', flexDirection: 'column', gap: '6px' },
  title:  { fontSize: '22px', fontWeight: 700 },
  sub:    { fontSize: '14px', color: 'var(--text)', margin: 0 },

  modeToggle: {
    display: 'flex', background: 'var(--surface-2)',
    border: '1px solid var(--border)', borderRadius: '8px',
    padding: '4px', gap: '4px', maxWidth: '300px',
  },
  modeBtn: {
    flex: 1, background: 'none', border: 'none', color: 'var(--text)',
    padding: '8px 14px', borderRadius: '6px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  },
  modeBtnActive: {
    background: 'var(--surface-3)', color: 'var(--text-bright)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  twoCol: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '20px', alignItems: 'start',
  },

  dropZone: {
    border: '2px dashed var(--border-2)', borderRadius: '12px',
    padding: '40px 20px', cursor: 'pointer', transition: 'all 0.2s',
    background: 'var(--surface)', textAlign: 'center',
  },
  dropZoneActive: {
    borderColor: 'var(--accent)', background: 'var(--accent-dim)',
    boxShadow: '0 0 0 3px var(--accent-glow)',
  },
  dropPrompt: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  browseLink: { color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' },

  panelHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
  },
  panelTitle: {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--text)',
  },

  queueRow: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
  },

  emptyPanel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '180px', textAlign: 'center',
  },

  successDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--success)', boxShadow: '0 0 8px var(--success)',
  },
  rowLabel: {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text)',
  },

  infoBox: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '18px 20px',
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