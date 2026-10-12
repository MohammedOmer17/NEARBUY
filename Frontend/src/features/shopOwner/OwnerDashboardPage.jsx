import { useEffect, useState } from 'react'
import { ArrowUpRight, PackageCheck, ReceiptText, Wallet2 } from 'lucide-react'
import { shopOwnerApi } from '../../services/api'
import { formatCurrency } from '../../utils/format'

const cardClass = 'rounded-2xl bg-white p-4 shadow-card'

export default function OwnerDashboardPage() {
  const [state, setState] = useState({ shop: null, owner: null, summary: null, stats: null, loading: true })

  useEffect(() => {
    let alive = true
    Promise.all([
      shopOwnerApi.me(),
      shopOwnerApi.salesSummary(),
      shopOwnerApi.salesStatistics(),
    ])
      .then(([profile, summary, stats]) => {
        if (!alive) return
        setState({
          shop: profile?.shop ?? null,
          owner: profile?.shopOwner ?? null,
          summary: summary?.summary ?? null,
          stats: stats?.statistics ?? null,
          loading: false,
        })
      })
      .catch(() => {
        if (!alive) return
        setState((current) => ({ ...current, loading: false }))
      })

    return () => { alive = false }
  }, [])

  if (state.loading) {
    return <div className="p-4 text-sm text-mute">Loading shop dashboard…</div>
  }

  const summary = state.summary ?? {}
  const stats = state.stats ?? {}

  return (
    <div className="space-y-4 p-4">
      <header className="rounded-2xl bg-brand-600 p-4 text-white shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-100">Shop overview</p>
        <h1 className="mt-2 text-2xl font-bold">{state.shop?.shopName || 'Your shop'}</h1>
        <p className="mt-1 text-sm text-brand-50">{state.owner?.name || 'Shop owner'} • {state.shop?.status || 'active'}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cardClass}>
          <div className="flex items-center justify-between text-mute">
            <span className="text-sm">Total sales</span>
            <Wallet2 className="h-5 w-5 text-brand-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{formatCurrency(summary.totalSales ?? 0)}</p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between text-mute">
            <span className="text-sm">Total orders</span>
            <ReceiptText className="h-5 w-5 text-brand-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{summary.totalOrders ?? 0}</p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between text-mute">
            <span className="text-sm">Completed</span>
            <PackageCheck className="h-5 w-5 text-brand-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{summary.completedOrders ?? 0}</p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between text-mute">
            <span className="text-sm">Avg. order</span>
            <ArrowUpRight className="h-5 w-5 text-brand-600" />
          </div>
          <p className="mt-3 text-2xl font-bold">{formatCurrency(summary.averageOrderValue ?? 0)}</p>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-bold">Operations</h2>
        <div className="mt-3 grid gap-2 text-sm text-mute">
          <div className="flex justify-between"><span>Orders in queue</span><strong className="text-ink">{stats.totalOrders ?? 0}</strong></div>
          <div className="flex justify-between"><span>Pickup orders</span><strong className="text-ink">{stats.pickupOrders ?? 0}</strong></div>
          <div className="flex justify-between"><span>Delivery orders</span><strong className="text-ink">{stats.deliveryOrders ?? 0}</strong></div>
        </div>
      </div>
    </div>
  )
}
