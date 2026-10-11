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
      <Link to={ROUTES.cart} className="pointer-events-auto flex h-14 animate-sheet items-center justify-between rounded-2xl bg-accent-500 px-4 text-white shadow-float active:bg-accent-600">
        <span className="flex items-center gap-2.5 font-bold">
          <ShoppingBag className="h-5 w-5" />
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
          <span className="font-medium text-white/80">{formatCurrency(estimatedTotal)}</span>
        </span>
        <span className="flex items-center font-bold">View cart<ChevronRight className="h-5 w-5" /></span>
      </Link>
    </div>
  )
}
