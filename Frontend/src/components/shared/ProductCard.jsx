import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import { formatCurrency, normalizeUnitLabel } from '../../utils/format'
import ProductImage from './ProductImage'
import AddControl from './AddControl'

export default function ProductCard({ product, showCompare = false }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl bg-white p-2.5 shadow-card">
      <Link to={ROUTES.product(product.id)} className="block min-w-0">
        <div className="aspect-square overflow-hidden rounded-xl bg-brand-50/60">
          <ProductImage src={product.image} alt={product.name} className="h-full w-full p-2" />
        </div>
        <h3 className="mt-2.5 min-h-10 break-words text-sm font-semibold leading-5">{product.name}</h3>
        {product.brand && <p className="mt-0.5 truncate text-xs font-medium text-brand-700">{product.brand}</p>}
        {product.variant && <p className="mt-0.5 truncate text-xs text-mute">{product.variant}</p>}
        {product.packSize || product.unit ? <p className="mt-0.5 truncate text-xs text-mute">{product.packSize || normalizeUnitLabel(product.unit)}</p> : null}
      </Link>
      <div className="mt-2.5 flex min-w-0 flex-wrap items-center justify-between gap-2">
        {showCompare ? (
          <Link to={ROUTES.product(product.id)} className="flex min-h-11 w-full items-center justify-center rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white active:bg-brand-700">Compare prices</Link>
        ) : (
          <>
            <span className="min-w-0 text-[15px] font-bold">{formatCurrency(product.price)}</span>
            <AddControl product={product} />
          </>
        )}
      </div>
    </article>
  )
}
