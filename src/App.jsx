// claude code

import { useState, useEffect } from 'react'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard    from './pages/Dashboard'
import './index.css'

// Simple state-based router (no react-router needed)
export default function App() {
  const [page, setPage] = useState('login')
  const [user, setUser] = useState(null)

  // Persist login across page refresh
  useEffect(() => {
    const stored = localStorage.getItem('hashsafe_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
        setPage('dashboard')
      } catch {
        localStorage.removeItem('hashsafe_user')
      }
    }
  }, [])

  function handleLogin(userData) {
    localStorage.setItem('hashsafe_user', JSON.stringify(userData))
    setUser(userData)
    setPage('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('hashsafe_user')
    setUser(null)
    setPage('login')
  }

  return (
    <>
      {page === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onGoRegister={() => setPage('register')}
        />
      )}
      {page === 'register' && (
        <RegisterPage
          onRegistered={() => setPage('login')}
          onGoLogin={() => setPage('login')}
        />
      )}
      {page === 'dashboard' && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </>
  )
}