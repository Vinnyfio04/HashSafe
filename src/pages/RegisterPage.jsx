import { useState } from 'react'
import { authAPI } from '../api'

export default function RegisterPage({ onRegistered, onGoLogin }) {
  const [form,    setForm]    = useState({ name: '', username: '', password: '', confirm: '' })
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const data = await authAPI.register(form.name, form.username, form.password)
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(true)
        setTimeout(onRegistered, 1800)
      }
    } catch {
      setError('Cannot reach server. Make sure the backend is running on port 3000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.panel} className="fade-up">

        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z"
                    stroke="var(--accent)" strokeWidth="1.8" fill="none"/>
              <path d="M9 12l2 2 4-4" stroke="var(--accent)" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={styles.logoText}>HashSafe</span>
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Create account</h1>
          <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0 }}>
            Start protecting your content with cryptographic hashes
          </p>
        </div>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">Account created! Redirecting to login…</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Jane Doe" value={form.name}
                   onChange={update('name')} required />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="jane_doe" value={form.username}
                   onChange={update('username')} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                     onChange={update('password')} required />
            </div>
            <div className="form-group">
              <label>Confirm</label>
              <input type="password" placeholder="••••••••" value={form.confirm}
                     onChange={update('confirm')} required />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || success}
                  style={{ width: '100%', padding: '13px', fontSize: '14px', marginTop: '4px' }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text)', margin: 0 }}>
          Already have an account?{' '}
          <button onClick={onGoLogin} style={styles.linkBtn}>Sign in</button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '24px',
  },
  panel: {
    width: '100%', maxWidth: '460px',
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: '16px', padding: '40px 36px',
    display: 'flex', flexDirection: 'column', gap: '22px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,232,198,0.06)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: {
    width: '42px', height: '42px', background: 'var(--accent-dim)',
    border: '1px solid rgba(0,232,198,0.2)', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: '26px',
    color: 'var(--text-bright)', letterSpacing: '0.06em',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  linkBtn: {
    background: 'none', border: 'none', color: 'var(--accent)',
    cursor: 'pointer', padding: 0, fontFamily: 'var(--font-ui)',
    fontWeight: 600, fontSize: '13px',
  },
}