import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Store } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useCart } from '../../../context/CartContext'
import { productApi } from '../../../services/api'
import { ROUTES } from '../../../config/routes'
import { formatCurrency, normalizeUnitLabel } from '../../../utils/format'
import PageHeader from '../../../components/shared/PageHeader'
import ProductImage from '../../../components/shared/ProductImage'
import QuantityStepper from '../../../components/ui/QuantityStepper'
import Skeleton from '../../../components/ui/Skeleton'
import ErrorState from '../../../components/ui/ErrorState'
import Button from '../../../components/ui/Button'

export default function ProductPage() {
  const { productId } = useParams()
  const { data: product, loading, error, reload } = useAsync(() => productApi.one(productId), [productId])
  const { quantityOf, add, setQty, isBusy } = useCart()
  const [qty, setLocalQty] = useState(1)

  if (loading) {
    return (
      <div><PageHeader title="" />
        <Skeleton className="m-4 aspect-square" /><div className="space-y-3 px-4"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-20" /></div>
      </div>
    )
  }
  if (error || !product) return <div><PageHeader title="Product" /><ErrorState error={error} onRetry={reload} title="Could not load this product" /></div>

  const inCart = quantityOf(product.id)
  const busy = isBusy(product.id)

  return (
    <div className="pb-32">
      <PageHeader title={product.name} />
      <div className="px-4 pt-4">
        <div className="aspect-square overflow-hidden rounded-3xl bg-white shadow-card">
          <ProductImage src={product.image} alt={product.name} className="h-full w-full p-6" />
        </div>
        <div className="mt-5">
          {product.brand && <p className="text-sm font-semibold text-brand-600">{product.brand}</p>}
          <h2 className="text-2xl font-bold leading-8">{product.name}</h2>
          {product.unit && <p className="mt-1 text-sm text-mute">{normalizeUnitLabel(product.unit)}</p>}
          <p className="mt-3 text-3xl font-extrabold">{formatCurrency(product.price)}</p>
        </div>
        {product.shopId && (
          <Link to={ROUTES.shop(product.shopId)} className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Store className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs text-mute">Sold by</span><span className="block truncate font-bold">{product.shopName || 'View shop'}</span></span>
          </Link>
        )}
        {product.description && (
          <section className="mt-5">
            <h3 className="mb-1.5 font-bold">About this product</h3>
            <p className="text-[15px] leading-6 text-mute">{product.description}</p>
          </section>
        )}
        {product.category && <p className="mt-4 text-sm text-mute">Category: <span className="font-semibold text-ink">{product.category}</span></p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-line bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        {!product.available ? (
          <Button full disabled>Currently unavailable</Button>
        ) : inCart > 0 ? (
          <div className="flex items-center gap-3">
            <QuantityStepper large value={inCart} disabled={busy} onChange={(n) => setQty(product.id, n)} />
            <Link to={ROUTES.cart} className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand-600 font-semibold text-white active:bg-brand-700">View cart</Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <QuantityStepper large value={qty} min={1} onChange={(n) => setLocalQty(Math.max(1, n))} />
            <Button full loading={busy} onClick={() => add(product, qty)}>Add to cart</Button>
          </div>
        )}
      </div>
    </div>
  )
}
