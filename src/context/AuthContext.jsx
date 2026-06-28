// oxlint-disable react/only-export-components
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SITE_CONFIG } from '../config.js'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SITE_CONFIG.memberSessionKey) || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem(SITE_CONFIG.memberSessionKey, JSON.stringify(user))
    else localStorage.removeItem(SITE_CONFIG.memberSessionKey)
  }, [user])

  async function loginWithGoogleProfile(profile) {
    const session = await api.loginUser(profile)
    setUser(session)
    return session
  }

  function logout() {
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      canComment: Boolean(user && user.status === 'Active'),
      isAdmin: user?.role === 'Admin',
      isModerator: user?.role === 'Admin' || user?.role === 'Moderator',
      loginWithGoogleProfile,
      logout,
      setUser,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
