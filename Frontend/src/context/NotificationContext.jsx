import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { notificationApi } from '../services/api'

const NotificationContext = createContext(null)

// No real-time notification event is documented, so the badge polls gently.
export function NotificationProvider({ children }) {
  const { customer } = useAuth()
  const [unread, setUnread] = useState(0)

  const refreshUnread = useCallback(async () => {
    try { setUnread(await notificationApi.unreadCount()) } catch { /* badge is non-critical */ }
  }, [])

  useEffect(() => {
    if (!customer) { setUnread(0); return }
    refreshUnread()
    const t = setInterval(() => { if (document.visibilityState === 'visible') refreshUnread() }, 60000)
    return () => clearInterval(t)
  }, [customer?._id, customer?.id, refreshUnread]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ unread, setUnread, refreshUnread }), [unread, refreshUnread])
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => useContext(NotificationContext)
