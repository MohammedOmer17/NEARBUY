import { useEffect, useState } from 'react'
import { LogOut, MapPin, Phone, Store, User } from 'lucide-react'
import { useOwnerAuth } from '../../context/OwnerAuthContext'
import { shopOwnerApi } from '../../services/api'
import PageHeader from '../../components/shared/PageHeader'
import Button from '../../components/ui/Button'

export default function OwnerProfilePage() {
  const { owner, logout } = useOwnerAuth()
  const [profile, setProfile] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      shopOwnerApi.me(),
      shopOwnerApi.payment(),
    ])
      .then(([profileRes, paymentRes]) => {
        if (!alive) return
        setProfile(profileRes ?? null)
        setPayment(paymentRes?.data ?? paymentRes ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => { alive = false }
  }, [])

  const shop = profile?.shop ?? null

  return (
    <div>
      <PageHeader title="Profile" back={false} />
      <div className="space-y-4 p-4">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">{(owner?.name || 'S').slice(0, 1).toUpperCase()}</div>
            <div>
              <p className="text-xl font-bold">{owner?.name || profile?.shopOwner?.name || 'Shop owner'}</p>
              <p className="text-sm text-mute">{owner?.email || profile?.shopOwner?.email || 'No email'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="space-y-3 text-sm text-mute">
            <div className="flex items-center gap-3"><User className="h-4 w-4 text-brand-600" /><span>{owner?.phone || profile?.shopOwner?.phone || 'Phone not available'}</span></div>
            <div className="flex items-center gap-3"><Store className="h-4 w-4 text-brand-600" /><span>{shop?.shopName || 'Shop not configured'}</span></div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-brand-600" /><span>{shop?.address || 'Address not configured'}</span></div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-brand-600" /><span>{shop?.contact || 'Contact not configured'}</span></div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="text-lg font-bold">Payment details</h2>
          {loading ? (
            <p className="mt-2 text-sm text-mute">Loading payment profile…</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-mute">
              <div className="flex justify-between"><span>UPI ID</span><strong className="text-ink">{payment?.upiId || 'Not configured'}</strong></div>
              <div className="flex justify-between"><span>QR code</span><strong className="text-ink">{payment?.qrCode ? 'Available' : 'Not configured'}</strong></div>
            </div>
          )}
        </div>

        <p className="rounded-2xl border border-dashed border-line bg-white p-3 text-sm text-mute">
          Shop edit endpoints are not currently exposed by the backend, so profile updates here remain read-only until the API is added.
        </p>

        <Button full variant="danger" onClick={() => logout()}><LogOut className="h-4 w-4" />Log out</Button>
      </div>
    </div>
  )
}
