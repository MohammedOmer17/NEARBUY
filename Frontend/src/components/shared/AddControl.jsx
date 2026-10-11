import { useCart } from '../../context/CartContext'
import QuantityStepper from '../ui/QuantityStepper'

export default function AddControl({ product, large = false }) {
  const { quantityOf, add, setQty, isBusy } = useCart()
  const qty = quantityOf(product.id)
  const busy = isBusy(product.id)

  if (!product.available) return <span className="rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-mute">Unavailable</span>
  if (qty > 0) return <QuantityStepper large={large} value={qty} disabled={busy} onChange={(n) => setQty(product.id, n)} />
  return (
    <button type="button" disabled={busy} onClick={() => add(product, 1)}
      className={`rounded-full border border-accent-500 font-bold text-accent-500 transition active:bg-accent-50 disabled:opacity-50 ${large ? 'h-12 px-8 text-base' : 'h-9 px-5 text-sm'}`}>
      Add
    </button>
  )
}
