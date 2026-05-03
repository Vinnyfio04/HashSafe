import { useState } from 'react'
import { authAPI } from '../api'

export default function LoginPage({ onLogin, onGoRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authAPI.login(username, password)
      if (data.error) {
        setError(data.error)
      } else {
        onLogin(data.user)
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

        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z"
                    stroke="var(--accent)" strokeWidth="1.8" fill="none"/>
              <path d="M9 12l2 2 4-4" stroke="var(--accent)" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={styles.logoText}>HashSafe</span>
        </div>

        <div style={styles.header}>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to manage your secured content</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '13px', fontSize: '14px', marginTop: '4px' }}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p style={styles.switchText}>
          No account?{' '}
          <button onClick={onGoRegister} style={styles.linkBtn}>
            Create one
          </button>
        </p>
      </div>

      {/* Decorative scan line */}
      <div style={styles.scanLine} />
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  panel: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: '16px',
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
    position: 'relative',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,232,198,0.06)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(0,232,198,0.2)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    color: 'var(--text-bright)',
    letterSpacing: '0.06em',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-bright)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text)',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--text)',
    margin: 0,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    fontSize: '13px',
  },
  scanLine: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
    opacity: 0.4,
    pointerEvents: 'none',
  },
}