import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBasket, Trash2 } from 'lucide-react'
import { useCart } from '../../../context/CartContext'
import { ROUTES } from '../../../config/routes'
import { formatCurrency, formatItemQuantity } from '../../../utils/format'
import PageHeader from '../../../components/shared/PageHeader'
import ProductImage from '../../../components/shared/ProductImage'
import QuantityStepper from '../../../components/ui/QuantityStepper'
import EmptyState from '../../../components/ui/EmptyState'
import Skeleton from '../../../components/ui/Skeleton'
import Button from '../../../components/ui/Button'

export default function CartPage() {
  const { cart, loading, setQty, remove, clear, estimatedTotal, itemCount } = useCart()
  const navigate = useNavigate()

  if (loading && !cart.items.length) {
    return <div><PageHeader title="Your cart" /><div className="space-y-3 p-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div></div>
  }
  if (!cart.items.length) {
    return (
      <div><PageHeader title="Your cart" />
        <EmptyState icon={ShoppingBasket} title="Your cart is empty" text="Add items from a nearby shop and they will show up here."
          action={<Button onClick={() => navigate(ROUTES.home)}>Browse shops</Button>} />
      </div>
    )
  }

  return (
    <div className="pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <PageHeader title="Your cart" right={<button onClick={clear} className="mr-1 flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-danger active:bg-danger-50"><Trash2 className="h-4 w-4" />Clear</button>} />
      <div className="space-y-4 p-4">
        {cart.shopName && <p className="text-sm text-mute">Ordering from <span className="font-bold text-ink">{cart.shopName}</span></p>}
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.productId} className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-white p-3 shadow-card sm:gap-3">
              <ProductImage src={i.image} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-brand-50/60 p-1 sm:h-16 sm:w-16" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-5">{i.name}</p>
                <p className="text-xs text-mute">{formatItemQuantity(i.quantity, i.unit)}</p>
                <p className="mt-1 break-words font-bold">{formatCurrency(i.price * i.quantity)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <QuantityStepper value={i.quantity} onChange={(n) => setQty(i.productId, n)} />
                <button onClick={() => remove(i.productId)} aria-label={`Remove ${i.name}`} className="text-xs font-semibold text-mute">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <Link to={cart.shopId ? ROUTES.shop(cart.shopId) : ROUTES.home} className="block text-center text-sm font-bold text-brand-600">Continue shopping</Link>

        <section className="rounded-2xl bg-white p-4 shadow-card">
          <h2 className="mb-3 font-bold">Bill details</h2>
          <div className="flex justify-between text-sm"><span className="text-mute">Items ({itemCount})</span><span className="font-semibold">{formatCurrency(estimatedTotal)}</span></div>
          <p className="mt-3 text-xs leading-5 text-mute">Delivery charges, if any, and the final total are confirmed by NearBuy when you place the order.</p>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-line bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <Button full onClick={() => navigate(ROUTES.checkout)}>Continue to checkout · {formatCurrency(estimatedTotal)}</Button>
      </div>
    </div>
  )
}
