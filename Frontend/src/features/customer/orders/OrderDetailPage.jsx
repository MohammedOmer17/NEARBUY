import { useEffect, useState } from 'react'
import { useLocation as useRouterLocation, useParams } from 'react-router-dom'
import { CheckCircle2, Copy, Navigation, Radio, Smartphone } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../context/ToastContext'
import { usePickupSharing } from '../../../hooks/usePickupSharing'
import { orderApi, shopApi } from '../../../services/api'
import { getErrorMessage } from '../../../services/apiClient'
import { ROUTES } from '../../../config/routes'
import { formatCurrency, formatDateTime, formatItemQuantity, qrSrc } from '../../../utils/format'
import { PAYMENT_METHOD_LABEL, TERMINAL } from '../../../utils/orderMeta'
import PageHeader from '../../../components/shared/PageHeader'
import OrderTimeline from '../../../components/shared/OrderTimeline'
import { OrderStatusBadge, PaymentStatusBadge } from '../../../components/shared/StatusBadge'
import ErrorState from '../../../components/ui/ErrorState'
import Skeleton from '../../../components/ui/Skeleton'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

function UpiPanel({ order, onMarkPaid, marking }) {
  const toast = useToast()
  const info = useAsync(() => shopApi.paymentInfo(order.shopId), [order.shopId], { enabled: order.paymentStatus === 'pending' || order.paymentStatus === 'customer_marked_paid' })
  const upiLink = info.data?.upiId ? `upi://pay?pa=${encodeURIComponent(info.data.upiId)}&am=${order.totalAmount}&cu=INR&tn=${encodeURIComponent(`NearBuy order ${order.id.slice(-6)}`)}` : ''
  const copy = async () => { try { await navigator.clipboard.writeText(info.data.upiId); toast.success('UPI ID copied') } catch { toast.error('Could not copy. Select the ID manually.') } }

  if (order.paymentStatus === 'paid') return null
  const marked = order.paymentStatus === 'customer_marked_paid'

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h2 className="font-bold">Pay {formatCurrency(order.totalAmount)} to the shop</h2>
      {info.loading ? <Skeleton className="mt-3 h-48" /> : info.error ? (
        <p role="alert" className="mt-3 rounded-xl bg-warn-50 p-3 text-sm text-warn">{getErrorMessage(info.error, 'The shop payment details are not available right now.')}</p>
      ) : (
        <div className="mt-3 flex flex-col items-center">
          {info.data?.qrCode ? <img src={qrSrc(info.data.qrCode)} alt="Shop UPI QR code" className="h-48 w-48 rounded-2xl border border-line object-contain p-2" /> : <p className="text-sm text-mute">The shop has not added a QR code.</p>}
          {info.data?.upiId && (
            <button onClick={copy} className="mt-3 flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700"><Copy className="h-4 w-4" />{info.data.upiId}</button>
          )}
          {upiLink && !marked && <a href={upiLink} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-600"><Smartphone className="h-4 w-4" />Open UPI app</a>}
        </div>
      )}
      {marked ? (
        <p className="mt-4 rounded-xl bg-warn-50 p-3 text-sm font-medium text-warn">You marked this as paid. Waiting for the shop to confirm it.</p>
      ) : (
        <>
          <p className="mt-4 text-xs leading-5 text-mute">After paying, tap the button below. The shop checks its account and confirms your payment.</p>
          <Button full className="mt-3" loading={marking} onClick={onMarkPaid}>I have paid</Button>
        </>
      )}
    </section>
  )
}

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const { state } = useRouterLocation()
  const toast = useToast()
  const [marking, setMarking] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { data: order, loading, error, reload } = useAsync(() => orderApi.get(orderId), [orderId])

  // No documented order-level realtime event for customers, so refresh while the order is active.
  useEffect(() => {
    if (!order || TERMINAL.includes(order.status)) return
    const t = setInterval(() => { if (document.visibilityState === 'visible') reload({ silent: true }) }, 15000)
    return () => clearInterval(t)
  }, [order?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const canShare = order?.fulfillmentType === 'pickup' && ['accepted', 'preparing', 'ready'].includes(order?.status)
  const share = usePickupSharing(orderId, canShare)

  if (loading && !order) return <div><PageHeader title="Order" fallback={ROUTES.orders} /><div className="space-y-3 p-4"><Skeleton className="h-40" /><Skeleton className="h-32" /></div></div>
  if (error || !order) return <div><PageHeader title="Order" fallback={ROUTES.orders} /><ErrorState error={error} onRetry={reload} title="Could not load this order" /></div>

  const markPaid = async () => {
    setMarking(true)
    try { await orderApi.markPaid(order.id); await reload({ silent: true }); toast.success('Marked as paid. Waiting for the shop.') }
    catch (e) { toast.error(getErrorMessage(e, 'Could not mark this order as paid.')) }
    finally { setMarking(false) }
  }
  const cancel = async () => {
    setCancelling(true)
    try { await orderApi.cancel(order.id); setCancelOpen(false); await reload({ silent: true }); toast.success('Order cancelled') }
    catch (e) { setCancelOpen(false); toast.error(getErrorMessage(e, 'This order can no longer be cancelled.')) }
    finally { setCancelling(false) }
  }

  const isPickup = order.fulfillmentType === 'pickup'
  const dest = order.shopLocation?.latitude != null ? `${order.shopLocation.latitude},${order.shopLocation.longitude}` : order.shopAddress
  const mapsUrl = dest ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=walking` : ''
  const cancellable = ['placed', 'accepted'].includes(order.status)

  return (
    <div className="pb-8">
      <PageHeader title="Order details" fallback={ROUTES.orders} />
      <div className="space-y-4 p-4">
        {state?.justPlaced && (
          <div className="flex items-center gap-3 rounded-2xl bg-ok-50 p-4 text-ok">
            <CheckCircle2 className="h-8 w-8 shrink-0" />
            <div><p className="font-bold">Order placed</p><p className="text-sm">{order.shopName} will confirm your order shortly.</p></div>
          </div>
        )}

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="truncate text-lg font-bold">{order.shopName}</p><p className="text-xs text-mute">Order {order.id.slice(-8).toUpperCase()} · {formatDateTime(order.createdAt)}</p></div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-4"><OrderTimeline order={order} /></div>
        </section>

        {order.paymentMethod === 'shop_upi' && order.status !== 'cancelled' && <UpiPanel order={order} onMarkPaid={markPaid} marking={marking} />}

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-2 font-bold">{isPickup ? 'Pickup' : 'Delivery'}</h2>
          {isPickup ? (
            <>
              {order.shopAddress && <p className="text-sm text-mute">Collect from {order.shopAddress}</p>}
              {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-600"><Navigation className="h-4 w-4" />Open directions in Maps</a>}
              {canShare && (
                <div className="mt-4 rounded-xl bg-canvas p-3">
                  <div className="flex items-center gap-3">
                    <Radio className={`h-5 w-5 ${share.sharing ? 'text-ok' : 'text-mute'}`} />
                    <p className="flex-1 text-sm">{share.sharing ? 'Sharing your live location with the shop' : 'Let the shop see you are on the way'}</p>
                    <Button size="sm" variant={share.sharing ? 'outline' : 'soft'} onClick={share.sharing ? share.stop : share.start}>{share.sharing ? 'Stop' : 'Share'}</Button>
                  </div>
                  {share.error && <p role="alert" className="mt-2 text-xs text-danger">{share.error}</p>}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-mute">{order.deliveryAddress || 'Address not available'}</p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-2 font-bold">Items</h2>
          <ul className="space-y-1.5 text-sm">
            {order.items.map((i, idx) => <li key={idx} className="flex justify-between gap-3"><span className="truncate">{formatItemQuantity(i.quantity, i.unit, i.name)}</span><span className="font-semibold">{formatCurrency(i.price * i.quantity)}</span></li>)}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line pt-3"><span className="font-bold">Total</span><span className="font-extrabold">{formatCurrency(order.totalAmount)}</span></div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-mute">{PAYMENT_METHOD_LABEL[order.paymentMethod] || 'Payment'}</span>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </section>

        {cancellable && <Button full variant="danger" onClick={() => setCancelOpen(true)}>Cancel order</Button>}
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this order?"
        footer={<><Button full variant="danger" loading={cancelling} onClick={cancel}>Cancel order</Button><Button full variant="ghost" onClick={() => setCancelOpen(false)}>Keep order</Button></>}>
        <p>The shop will be told right away. This cannot be undone.</p>
      </Modal>
    </div>
  )
}
