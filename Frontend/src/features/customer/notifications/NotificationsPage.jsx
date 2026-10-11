import { useEffect, useState } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useNotifications } from '../../../context/NotificationContext'
import { useToast } from '../../../context/ToastContext'
import { notificationApi } from '../../../services/api'
import { getErrorMessage } from '../../../services/apiClient'
import { formatDateTime } from '../../../utils/format'
import PageHeader from '../../../components/shared/PageHeader'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Skeleton from '../../../components/ui/Skeleton'

export default function NotificationsPage() {
  const toast = useToast()
  const { setUnread, refreshUnread } = useNotifications()
  const { data, loading, error, reload } = useAsync(() => notificationApi.list(), [])
  const [items, setItems] = useState([])
  useEffect(() => { if (data) setItems(data) }, [data])

  const unreadCount = items.filter((n) => !n.isRead).length
  useEffect(() => { if (data) setUnread(data.filter((n) => !n.isRead).length) }, [data, setUnread])

  const open = async (n) => {
    if (n.isRead) return
    setItems((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
    try { await notificationApi.markRead(n.id) } catch (e) { toast.error(getErrorMessage(e)); reload({ silent: true }) }
    refreshUnread()
  }
  const readAll = async () => {
    setItems((l) => l.map((x) => ({ ...x, isRead: true })))
    try { await notificationApi.markAllRead(); setUnread(0) } catch (e) { toast.error(getErrorMessage(e)); reload({ silent: true }) }
  }
  const remove = async (n) => {
    const prev = items
    setItems((l) => l.filter((x) => x.id !== n.id))
    try { await notificationApi.remove(n.id); refreshUnread() } catch (e) { setItems(prev); toast.error(getErrorMessage(e)) }
  }

  return (
    <div>
      <PageHeader title="Notifications" right={unreadCount > 0 && <button onClick={readAll} className="mr-1 rounded-full px-3 py-2 text-sm font-bold text-brand-600 active:bg-brand-50">Mark all read</button>} />
      <div className="space-y-2.5 p-4">
        {loading ? <><Skeleton className="h-20" /><Skeleton className="h-20" /></>
          : error ? <ErrorState error={error} onRetry={reload} title="Could not load notifications" />
          : items.length ? items.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 rounded-2xl p-3.5 shadow-card ${n.isRead ? 'bg-white' : 'bg-brand-50'}`}>
              <button onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-label={`${n.title}${n.isRead ? '' : ', unread'}`}>
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-accent-500'}`} />
                <span className="min-w-0"><span className="block font-bold">{n.title}</span><span className="mt-0.5 block text-sm leading-5 text-mute">{n.message}</span><span className="mt-1 block text-xs text-mute/80">{formatDateTime(n.createdAt)}</span></span>
              </button>
              <button onClick={() => remove(n)} aria-label="Delete notification" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute active:bg-white"><Trash2 className="h-4 w-4" /></button>
            </div>
          )) : <EmptyState icon={Bell} title="You are all caught up" text="Order updates from shops will show up here." />}
      </div>
    </div>
  )
}
