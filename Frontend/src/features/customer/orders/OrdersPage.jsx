import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ReceiptText } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { orderApi } from '../../../services/api'
import { ROUTES } from '../../../config/routes'
import { formatCurrency, formatDateTime } from '../../../utils/format'
import { TERMINAL } from '../../../utils/orderMeta'
import PageHeader from '../../../components/shared/PageHeader'
import { OrderStatusBadge } from '../../../components/shared/StatusBadge'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Skeleton from '../../../components/ui/Skeleton'
import Button from '../../../components/ui/Button'

export default function OrdersPage() {
  const [tab, setTab] = useState('active')
  const { data, loading, error, reload } = useAsync(() => orderApi.list(), [])
  const orders = [...(data || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const shown = orders.filter((o) => (tab === 'active') === !TERMINAL.includes(o.status))

  return (
    <div>
      <PageHeader title="Your orders" back={false} />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 rounded-full bg-white p-1 shadow-card" role="tablist">
          {[['active', 'Active'], ['past', 'Past']].map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`h-10 rounded-full text-sm font-bold transition ${tab === k ? 'bg-brand-600 text-white' : 'text-mute'}`}>{label}</button>
          ))}
        </div>
        <div className="mt-4 space-y-3 pb-6">
          {loading ? <><Skeleton className="h-24" /><Skeleton className="h-24" /></>
            : error ? <ErrorState error={error} onRetry={reload} title="Could not load your orders" />
            : shown.length ? shown.map((o) => (
              <Link key={o.id} to={ROUTES.order(o.id)} className="block rounded-2xl bg-white p-4 shadow-card transition active:scale-[0.99]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="truncate font-bold">{o.shopName}</p><p className="text-xs text-mute">{formatDateTime(o.createdAt)}</p></div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-mute">{o.items.length} {o.items.length === 1 ? 'item' : 'items'} · {o.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                  <span className="flex items-center font-bold">{formatCurrency(o.totalAmount)}<ChevronRight className="h-4 w-4 text-mute" /></span>
                </div>
              </Link>
            )) : (
              <EmptyState icon={ReceiptText} title={tab === 'active' ? 'No active orders' : 'No past orders'}
                text={tab === 'active' ? 'Orders you place will show up here.' : 'Completed and cancelled orders will appear here.'}
                action={tab === 'active' && <Link to={ROUTES.home}><Button>Start shopping</Button></Link>} />
            )}
        </div>
      </div>
    </div>
  )
}
