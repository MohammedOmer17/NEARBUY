import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authed | guest

  // Session restore: the cookie is sent automatically, we just ask who we are.
  useEffect(() => {
    let alive = true
    authApi.profile()
      .then((c) => { if (!alive) return; if (c?.email || c?._id) { setCustomer(c); setStatus('authed') } else setStatus('guest') })
      .catch(() => alive && setStatus('guest'))
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const onExpired = () => { setCustomer(null); setStatus('guest') }
    window.addEventListener('nearbuy:unauthorized', onExpired)
    return () => window.removeEventListener('nearbuy:unauthorized', onExpired)
  }, [])

  const login = useCallback(async (email, password) => {
    await authApi.login({ email, password })
    const c = await authApi.profile()
    if (!c) throw new Error('Signed in, but the session could not start. Make sure cookies are allowed.')
    setCustomer(c)
    setStatus('authed')
  }, [])

  const register = useCallback(async ({ name, email, phone, password }) => {
    await authApi.register({ name, email, phone, password })
    await login(email, password)
  }, [login])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* cookie is cleared server side when possible */ }
    setCustomer(null)
    setStatus('guest')
  }, [])

  const updateCustomer = useCallback((patch) => setCustomer((c) => (c ? { ...c, ...patch } : c)), [])

  const value = useMemo(() => ({ customer, status, login, register, logout, updateCustomer }),
    [customer, status, login, register, logout, updateCustomer])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
