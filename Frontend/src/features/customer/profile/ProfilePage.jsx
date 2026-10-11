import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, LogOut, MapPin, Phone } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useLocation } from '../../../context/LocationContext'
import { useNotifications } from '../../../context/NotificationContext'
import { ROUTES } from '../../../config/routes'
import { formatDateTime, initials } from '../../../utils/format'
import PageHeader from '../../../components/shared/PageHeader'
import Button from '../../../components/ui/Button'

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="h-5 w-5 shrink-0 text-brand-600" />
      <div className="min-w-0"><p className="text-xs text-mute">{label}</p><p className="truncate font-semibold">{value || 'Not added'}</p></div>
    </div>
  )
}

export default function ProfilePage() {
  const { customer, logout } = useAuth()
  const { location, openSheet } = useLocation()
  const { unread } = useNotifications()
  const [leaving, setLeaving] = useState(false)

  return (
    <div>
      <PageHeader title="Profile" back={false} />
      <div className="space-y-4 p-4">
        <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-600 text-xl font-bold text-white">{initials(customer?.name)}</div>
          <div className="min-w-0"><h2 className="truncate text-lg font-bold">{customer?.name}</h2><p className="truncate text-sm text-mute">{customer?.email}</p></div>
        </section>

        <section className="divide-y divide-line rounded-2xl bg-white px-4 shadow-card">
          <Row icon={Phone} label="Phone" value={customer?.phone} />
          <div className="flex items-center gap-3 py-3">
            <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1"><p className="text-xs text-mute">Saved location</p><p className="font-semibold">{location ? `Updated ${formatDateTime(location.updatedAt) || 'recently'}` : 'Not set'}</p></div>
            <Button size="sm" variant="soft" onClick={openSheet}>{location ? 'Update' : 'Set'}</Button>
          </div>
        </section>

        <Link to={ROUTES.notifications} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
          <Bell className="h-5 w-5 text-brand-600" /><span className="flex-1 font-semibold">Notifications</span>
          {unread > 0 && <span className="rounded-full bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>}
          <ChevronRight className="h-5 w-5 text-mute" />
        </Link>

        <Button full variant="danger" loading={leaving} onClick={async () => { setLeaving(true); await logout() }}><LogOut className="h-4 w-4" />Log out</Button>
      </div>
    </div>
  )
}
