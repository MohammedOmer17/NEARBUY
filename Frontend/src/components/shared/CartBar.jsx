import { Link } from 'react-router-dom'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatCurrency } from '../../utils/format'
import { ROUTES } from '../../config/routes'

export default function CartBar({ bottom }) {
  const { itemCount, estimatedTotal } = useCart()
  if (!itemCount) return null
  const offset = bottom === 0 ? 'bottom-[calc(0.75rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))]'
  return (
    <div className={`pointer-events-none fixed inset-x-0 ${offset} z-30 mx-auto w-full max-w-md px-4`}>
      <Link to={ROUTES.cart} className="pointer-events-auto flex h-14 min-w-0 animate-sheet items-center justify-between gap-2 rounded-2xl bg-accent-500 px-3 text-white shadow-float active:bg-accent-600 sm:px-4">
        <span className="flex min-w-0 items-center gap-2 font-bold">
          <ShoppingBag className="h-5 w-5" />
          <span className="shrink-0">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          <span className="truncate font-medium text-white/80">{formatCurrency(estimatedTotal)}</span>
        </span>
        <span className="flex shrink-0 items-center text-sm font-bold">View cart<ChevronRight className="h-5 w-5" /></span>
      </Link>
    </div>
  )
}
