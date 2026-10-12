import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Truck } from 'lucide-react'
import { shopOwnerApi } from '../../services/api'
import PageHeader from '../../components/shared/PageHeader'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../utils/format'

const STATUS_LABEL = {
  placed: 'Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked up',
  out_for_delivery: 'Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const NEXT_STATUS = {
  placed: ['accepted'],
  accepted: ['preparing'],
  preparing: ['ready'],
  ready: ['picked_up'],
  picked_up: ['completed'],
}

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = async () => {
    try {
      setLoading(true)
      const payload = await shopOwnerApi.listOrders()
      setOrders(Array.isArray(payload) ? payload : [])
      setError('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load shop orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleAction = async (orderId, action, status) => {
    try {
      if (action === 'accept') {
        await shopOwnerApi.acceptOrder(orderId)
      }
      if (action === 'status') {
        await shopOwnerApi.updateOrderStatus(orderId, status)
      }
      if (action === 'confirm-upi') {
        await shopOwnerApi.confirmPayment(orderId)
      }
      if (action === 'confirm-cod') {
        await shopOwnerApi.confirmCodPayment(orderId)
      }
      await loadOrders()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update order.')
    }
  }

  const statusOptions = useMemo(() => ({
    placed: ['accepted'],
    accepted: ['preparing'],
    preparing: ['ready'],
    ready: ['picked_up'],
    picked_up: ['completed'],
  }), [])

  return (
    <div>
      <PageHeader title="Orders" back={false} />
      <div className="space-y-3 p-4">
        {error && <p className="rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger">{error}</p>}
        {loading ? (
          <p className="text-sm text-mute">Loading incoming orders…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-mute shadow-card">No orders yet.</div>
        ) : (
          orders.map((order) => {
            const paymentStatus = order?.payment?.status || 'pending'
            const nextStatuses = statusOptions[order?.orderStatus] ?? []
            const canConfirmPayment = ['upi', 'cod'].includes(order?.payment?.method) && paymentStatus !== 'paid'

            return (
              <div key={order._id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{order?.customer?.name || 'Customer'}</p>
                    <p className="text-sm text-mute">{order?.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'} • {order?.items?.length || 0} items</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{STATUS_LABEL[order?.orderStatus] || order?.orderStatus}</span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-mute">
                  <div className="flex justify-between"><span>Amount</span><strong className="text-ink">{formatCurrency(order?.totalAmount || 0)}</strong></div>
                  <div className="flex justify-between"><span>Payment</span><strong className="text-ink">{order?.payment?.method || 'pending'}</strong></div>
                  <div className="flex justify-between"><span>Location</span><strong className="text-ink">{order?.fulfillmentType === 'pickup' ? 'Store pickup' : order?.deliveryAddress || 'Address on file'}</strong></div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order?.orderStatus === 'placed' && (
                    <Button size="sm" onClick={() => handleAction(order._id, 'accept')}>Accept</Button>
                  )}
                  {nextStatuses.length > 0 && (
                    <select
                      className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none"
                      defaultValue=""
                      onChange={(event) => {
                        const nextStatus = event.target.value
                        if (nextStatus) handleAction(order._id, 'status', nextStatus)
                        event.target.value = ''
                      }}
                    >
                      <option value="">Update status</option>
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                      ))}
                    </select>
                  )}
                  {canConfirmPayment && (
                    <Button variant="soft" size="sm" onClick={() => handleAction(order._id, order.payment?.method === 'cod' ? 'confirm-cod' : 'confirm-upi')}>
                      {order.payment?.method === 'cod' ? 'Confirm COD' : 'Confirm payment'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
