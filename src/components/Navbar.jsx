import { authAPI } from '../api'

export default function Navbar({ user, activeTab, onTabChange, onLogout }) {
  async function handleLogout() {
    await authAPI.logout()
    onLogout()
  }

  const tabs = [
    { id: 'upload',  label: 'Upload',   icon: '⬆' },
    { id: 'hashes',  label: 'Hashes',   icon: '#' },
    { id: 'content', label: 'Content',  icon: '◈' },
    { id: 'verify',  label: 'Verify',   icon: '✓' },
  ]

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z"
                    stroke="var(--accent)" strokeWidth="2" fill="none"/>
              <path d="M9 12l2 2 4-4" stroke="var(--accent)" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={styles.logoText}>HashSafe</span>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* User area */}
        <div style={styles.userArea}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span style={styles.userName}>{user?.username || 'User'}</span>
          </div>
          <button className="btn-ghost" onClick={handleLogout} style={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: 'rgba(13,14,27,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  inner: {
    maxWidth: '1200px', margin: '0 auto',
    padding: '0 24px',
    display: 'flex', alignItems: 'center', gap: '32px',
    height: '60px',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  logoIcon: {
    width: '32px', height: '32px', background: 'var(--accent-dim)',
    border: '1px solid rgba(0,232,198,0.2)', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: '22px',
    color: 'var(--text-bright)', letterSpacing: '0.06em',
  },
  tabs: { display: 'flex', gap: '4px', flex: 1 },
  tab: {
    background: 'none', border: 'none', color: 'var(--text)',
    padding: '7px 14px', borderRadius: '6px',
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(0,232,198,0.2)',
  },
  tabIcon: { fontSize: '14px' },
  userArea: { display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: {
    width: '30px', height: '30px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(0,232,198,0.3)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 700, color: 'var(--accent)',
  },
  userName: { fontSize: '13px', color: 'var(--text-2)', fontWeight: 600 },
  logoutBtn: { padding: '6px 14px', fontSize: '12px' },
}