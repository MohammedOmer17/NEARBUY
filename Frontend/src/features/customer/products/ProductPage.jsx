import { Link, useParams } from 'react-router-dom'
import { PackageSearch, Store } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { productApi } from '../../../services/api'
import { ROUTES } from '../../../config/routes'
import { formatCurrency, normalizeUnitLabel } from '../../../utils/format'
import PageHeader from '../../../components/shared/PageHeader'
import ProductImage from '../../../components/shared/ProductImage'
import Skeleton from '../../../components/ui/Skeleton'
import ErrorState from '../../../components/ui/ErrorState'
import EmptyState from '../../../components/ui/EmptyState'

export default function ProductPage() {
  const { productId } = useParams()
  const { data, loading, error, reload } = useAsync(() => productApi.offers(productId), [productId])

  if (loading) {
    return (
      <div>
        <PageHeader title="" />
        <Skeleton className="m-4 aspect-square" />
        <div className="space-y-3 px-4"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-20" /></div>
      </div>
    )
  }
  if (error) return <div><PageHeader title="Product" /><ErrorState error={error} onRetry={reload} title="Could not load this product" /></div>
  if (!data?.product) {
    return (
      <div>
        <PageHeader title="Product" />
        <EmptyState icon={PackageSearch} title="Product is no longer available" text="It may have been removed or sold out. Return to the home page to browse other products." action={<Link to={ROUTES.home} className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white">Browse products</Link>} />
      </div>
    )
  }

  const product = data.product
  const offers = data.offers.filter((offer) => offer.shopId && offer.available && Number.isFinite(offer.price) && offer.price >= 0)

  return (
    <div>
      <PageHeader title={product.name} />
      <div className="space-y-5 px-4 pb-8 pt-4">
        <div className="aspect-square w-full overflow-hidden rounded-3xl bg-white shadow-card">
          <ProductImage src={product.image} alt={product.name} className="h-full w-full p-6" />
        </div>

        <section className="min-w-0">
          {product.brand && <p className="text-sm font-semibold text-brand-600">{product.brand}</p>}
          <h2 className="break-words text-2xl font-bold leading-8">{product.name}</h2>
          {product.variant && <p className="mt-1 text-sm text-mute">{product.variant}</p>}
          {(product.packSize || product.unit) && (
            <p className={`${product.variant ? 'mt-0.5' : 'mt-1'} text-sm text-mute`}>{product.packSize || normalizeUnitLabel(product.unit)}</p>
          )}
          {product.description && (
            <div className="mt-4">
              <h3 className="mb-1.5 font-bold">About this product</h3>
              <p className="break-words text-[15px] leading-6 text-mute">{product.description}</p>
            </div>
          )}
          {product.category && <p className="mt-3 text-sm text-mute">Category: <span className="font-semibold text-ink">{product.category}</span></p>}
        </section>

        <section aria-labelledby="compare-prices-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 id="compare-prices-heading" className="font-bold">Compare prices</h3>
            <span className="text-xs font-semibold text-brand-700">{offers.length} offer{offers.length === 1 ? '' : 's'}</span>
          </div>
          {!offers.length ? (
            <EmptyState icon={Store} title="No offers available" text="Shops do not currently have this product in stock." />
          ) : (
            <ul className="space-y-3">
              {offers.map((offer) => {
                const shopName = offer.shopName || 'Local shop'
                const selectShopState = {
                  shop: {
                    id: offer.shopId,
                    name: shopName,
                  },
                  selectedOffer: {
                    productId: offer.id,
                    price: offer.price,
                    unit: offer.unit,
                    packSize: offer.packSize,
                    variant: offer.variant,
                    available: offer.available,
                  },
                }

                return (
                  <li key={offer.id} className="min-w-0 rounded-2xl border border-line bg-white p-3.5 shadow-card">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold">{shopName}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-extrabold tabular-nums">{formatCurrency(offer.price)}</p>
                        {(offer.packSize || offer.unit) && (
                          <p className="text-xs text-mute">{offer.packSize || normalizeUnitLabel(offer.unit)}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      {offer.available ? (
                        <Link
                          to={ROUTES.shop(offer.shopId)}
                          state={selectShopState}
                          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white active:bg-brand-700"
                        >
                          <Store className="h-4 w-4 shrink-0" /> Select shop
                        </Link>
                      ) : (
                        <button type="button" disabled className="min-h-11 w-full rounded-full bg-canvas px-4 py-2 text-sm font-semibold text-mute">
                          Currently unavailable
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
