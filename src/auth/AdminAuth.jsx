import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearAdminSession, readAdminSession, signInDemoAdmin } from './demoAdminAuth'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(readAdminSession)

  const signIn = useCallback((credentials) => {
    const session = signInDemoAdmin(credentials)
    if (!session) return false
    setAdmin(session)
    return true
  }, [])

  const signOut = useCallback(() => {
    clearAdminSession()
    setAdmin(null)
  }, [])

  useEffect(() => {
    if (!admin) return undefined
    const timer = window.setTimeout(signOut, Math.max(0, admin.expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [admin, signOut])

  const value = useMemo(() => ({ admin, signIn, signOut }), [admin, signIn, signOut])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return context
}
