import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Store, Bike, Banknote, QrCode, MapPin } from 'lucide-react'
import { useCart } from '../../../context/CartContext'
import { useLocation } from '../../../context/LocationContext'
import { orderApi } from '../../../services/api'
import { getErrorMessage } from '../../../services/apiClient'
import { ROUTES } from '../../../config/routes'
import { formatCurrency, formatItemQuantity } from '../../../utils/format'
import PageHeader from '../../../components/shared/PageHeader'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'

const ADDRESS_KEY = 'nearbuy:lastDeliveryAddress'
const readAddress = () => { try { return localStorage.getItem(ADDRESS_KEY) || '' } catch { return '' } }
const saveAddress = (v) => { try { localStorage.setItem(ADDRESS_KEY, v) } catch { /* optional convenience */ } }

function Choice({ selected, onSelect, icon: Icon, title, text }) {
  return (
    <button type="button" onClick={onSelect} role="radio" aria-checked={selected}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3.5 text-left transition ${selected ? 'border-brand-600 bg-brand-50/50' : 'border-transparent shadow-card'}`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${selected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block break-words font-bold">{title}</span><span className="block text-xs text-mute">{text}</span></span>
      <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${selected ? 'border-brand-600' : 'border-line'}`}>{selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}</span>
    </button>
  )
}

export default function CheckoutPage() {
  const { cart, loading, estimatedTotal, refresh, itemCount } = useCart()
  const { location, openSheet } = useLocation()
  const navigate = useNavigate()
  const [fulfillment, setFulfillment] = useState('pickup')
  const [payment, setPayment] = useState('shop_upi')
  const [address, setAddress] = useState(readAddress)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const lock = useRef(false) // prevents duplicate submissions

  if (loading) return <div><PageHeader title="Checkout" fallback={ROUTES.cart} /><div className="space-y-3 p-4"><Skeleton className="h-28" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div></div>
  if (!cart.items.length && !submitting) return <Navigate to={ROUTES.cart} replace />
  const delivery = fulfillment === 'delivery'

  const placeOrder = async () => {
    if (lock.current) return
    const next = {}
    if (delivery) {
      if (address.trim().length < 8) next.address = 'Enter a full delivery address'
      if (!location) next.location = 'Set your location so the shop can find you'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    lock.current = true
    setSubmitting(true)
    setServerError('')
    const payload = {
      fulfillmentType: fulfillment,
      paymentMethod: payment,
      payment: { method: payment },
      ...(delivery && {
        deliveryAddress: address.trim(),
        deliveryLocation: { latitude: location.latitude, longitude: location.longitude },
      }),
    }
    try {
      const order = await orderApi.create(payload)
      if (delivery) saveAddress(address.trim())
      await refresh()
      navigate(ROUTES.order(order.id), { replace: true, state: { justPlaced: true } })
    } catch (e) {
      setServerError(getErrorMessage(e, 'Could not place your order.'))
      lock.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <PageHeader title="Checkout" fallback={ROUTES.cart} />
      <div className="space-y-5 p-4">
        <section className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{cart.shopName || 'Your order'}</h2>
            <span className="text-sm text-mute">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-mute">
            {cart.items.map((i) => <li key={i.productId} className="flex min-w-0 justify-between gap-3"><span className="min-w-0 break-words">{formatItemQuantity(i.quantity, i.unit, i.name)}</span><span className="shrink-0">{formatCurrency(i.price * i.quantity)}</span></li>)}
          </ul>
        </section>

        <section role="radiogroup" aria-label="How do you want your order" className="space-y-2.5">
          <h2 className="font-bold">How do you want it?</h2>
          <Choice selected={!delivery} onSelect={() => setFulfillment('pickup')} icon={Store} title="Pickup from shop" text="You collect the order from the shop." />
          <Choice selected={delivery} onSelect={() => setFulfillment('delivery')} icon={Bike} title="Delivery to address" text="A Captain brings it to you." />
        </section>

        {delivery && (
          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
            <h2 className="font-bold">Delivery address</h2>
            <label className="block">
              <span className="sr-only">Delivery address</span>
              <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House or flat number, street, landmark"
                className={`w-full resize-none rounded-xl border bg-white p-3.5 outline-none placeholder:text-mute/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${errors.address ? 'border-danger' : 'border-line'}`} />
            </label>
            {errors.address && <p role="alert" className="text-xs text-danger">{errors.address}</p>}
            <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
              <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
              <p className="flex-1 text-sm">{location ? 'Using your saved location' : 'No location saved yet'}</p>
              <Button size="sm" variant="soft" onClick={openSheet}>{location ? 'Update' : 'Set'}</Button>
            </div>
            {errors.location && <p role="alert" className="text-xs text-danger">{errors.location}</p>}
          </section>
        )}

        <section role="radiogroup" aria-label="Payment method" className="space-y-2.5">
          <h2 className="font-bold">Payment</h2>
          <Choice selected={payment === 'shop_upi'} onSelect={() => setPayment('shop_upi')} icon={QrCode} title="Shop UPI" text="Pay the shop by UPI. The shop confirms your payment." />
          <Choice selected={payment === 'cod'} onSelect={() => setPayment('cod')} icon={Banknote} title={delivery ? 'Cash on Delivery' : 'Cash at shop'} text={delivery ? 'Pay in cash when your order arrives.' : 'Pay in cash when you collect.'} />
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex justify-between"><span className="font-bold">Estimated total</span><span className="font-extrabold">{formatCurrency(estimatedTotal)}</span></div>
          <p className="mt-2 text-xs leading-5 text-mute">NearBuy confirms the final amount, including any delivery charge, when you place the order.</p>
        </section>

        {serverError && <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger">{serverError}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-line bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <Button full loading={submitting} onClick={placeOrder}>Place order</Button>
      </div>
    </div>
  )
}
