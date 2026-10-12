import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { shopOwnerApi } from '../services/api'

const OwnerAuthContext = createContext(null)

export function OwnerAuthProvider({ children }) {
  const [owner, setOwner] = useState(null)
  const [status, setStatus] = useState('loading')

  const refresh = useCallback(async () => {
    try {
      const me = await shopOwnerApi.me()
      const nextOwner = me?.shopOwner ?? me?.owner ?? me?.data ?? null
      setOwner(nextOwner)
      setStatus(nextOwner ? 'authed' : 'guest')
      return nextOwner
    } catch {
      setOwner(null)
      setStatus('guest')
      return null
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    await shopOwnerApi.login({ email, password })
    const me = await shopOwnerApi.me()
    const nextOwner = me?.shopOwner ?? me?.owner ?? me?.data ?? null
    if (!nextOwner) throw new Error('Shop owner session could not be restored.')
    setOwner(nextOwner)
    setStatus('authed')
    return nextOwner
  }, [])

  const register = useCallback(async (payload) => {
    await shopOwnerApi.register(payload)
    return login(payload.email, payload.password)
  }, [login])

  const logout = useCallback(async () => {
    try {
      await shopOwnerApi.logout()
    } catch {
      // Server-side cookie cleanup is best-effort.
    }
    setOwner(null)
    setStatus('guest')
  }, [])

  const value = useMemo(() => ({ owner, status, login, register, logout, refresh }), [owner, status, login, register, logout, refresh])

  return <OwnerAuthContext.Provider value={value}>{children}</OwnerAuthContext.Provider>
}

export const useOwnerAuth = () => useContext(OwnerAuthContext)
