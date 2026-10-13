import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Store } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useCart } from '../../../context/CartContext'
import { useLocation } from '../../../context/LocationContext'
import { productApi, shopApi } from '../../../services/api'
import { groupProductsByIdentity } from '../../../services/normalizers'
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
  const { location } = useLocation()
  const { data: allProducts, loading, error, reload } = useAsync(() => productApi.all(), [])
  const { data: nearbyShops } = useAsync(() => shopApi.assess(location.latitude, location.longitude), [location?.latitude, location?.longitude], { enabled: !!location })
  const { quantityOf, add, setQty, isBusy } = useCart()
  const [qty, setLocalQty] = useState(1)

  const groupedProducts = useMemo(() => groupProductsByIdentity(allProducts || []), [allProducts])
  const productGroup = useMemo(() => {
    if (!groupedProducts.length) return null
    return groupedProducts.find((group) => String(group.id) === String(productId))
      || groupedProducts.find((group) => group.offers.some((offer) => String(offer.id) === String(productId)))
      || null
  }, [groupedProducts, productId])

  const allOffers = productGroup?.offers || []
  const [selectedOfferId, setSelectedOfferId] = useState(productId)

  useEffect(() => {
    if (!allOffers.length) return
    const nextSelection = allOffers.find((offer) => String(offer.id) === String(productId)) || allOffers[0]
    setSelectedOfferId(nextSelection.id)
  }, [allOffers, productId])

  const selectedOffer = allOffers.find((offer) => String(offer.id) === String(selectedOfferId)) || allOffers[0] || null
  const shopLookup = useMemo(() => new Map((nearbyShops || []).map((shop) => [String(shop.id), shop])), [nearbyShops])
  const selectedShopInfo = selectedOffer ? shopLookup.get(String(selectedOffer.shopId)) || { id: selectedOffer.shopId, name: selectedOffer.shopName || 'Local shop', address: '', distanceKm: null } : null

  if (loading && !productGroup) {
    return (
      <div><PageHeader title="" />
        <Skeleton className="m-4 aspect-square" /><div className="space-y-3 px-4"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-20" /></div>
      </div>
    )
  }
  if (error || !productGroup || !selectedOffer) return <div><PageHeader title="Product" /><ErrorState error={error} onRetry={reload} title="Could not load this product" /></div>

  const inCart = quantityOf(selectedOffer.id)
  const busy = isBusy(selectedOffer.id)

  return (
    <div className="pb-32">
      <PageHeader title={selectedOffer.name} />
      <div className="px-4 pt-4">
        <div className="aspect-square overflow-hidden rounded-3xl bg-white shadow-card">
          <ProductImage src={selectedOffer.image} alt={selectedOffer.name} className="h-full w-full p-6" />
        </div>
        <div className="mt-5">
          {selectedOffer.brand && <p className="text-sm font-semibold text-brand-600">{selectedOffer.brand}</p>}
          <h2 className="text-2xl font-bold leading-8">{selectedOffer.name}</h2>
          {selectedOffer.unit && <p className="mt-1 text-sm text-mute">{normalizeUnitLabel(selectedOffer.unit)}</p>}
          <p className="mt-3 text-3xl font-extrabold">{formatCurrency(selectedOffer.price)}</p>
        </div>
        {selectedOffer.shopId && (
          <Link to={ROUTES.shop(selectedOffer.shopId)} state={{ shop: { id: selectedOffer.shopId, name: selectedShopInfo?.name || selectedOffer.shopName || 'Shop', address: selectedShopInfo?.address || '', distanceKm: selectedShopInfo?.distanceKm ?? null } }} className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Store className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs text-mute">Sold by</span><span className="block truncate font-bold">{selectedShopInfo?.name || selectedOffer.shopName || 'View shop'}</span></span>
          </Link>
        )}
        {selectedOffer.description && (
          <section className="mt-5">
            <h3 className="mb-1.5 font-bold">About this product</h3>
            <p className="text-[15px] leading-6 text-mute">{selectedOffer.description}</p>
          </section>
        )}
        {selectedOffer.category && <p className="mt-4 text-sm text-mute">Category: <span className="font-semibold text-ink">{selectedOffer.category}</span></p>}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-bold">Available at nearby shops</h3>
            <span className="text-xs font-semibold text-brand-700">{allOffers.length} offer{allOffers.length === 1 ? '' : 's'}</span>
          </div>
          <div className="space-y-3">
            {allOffers.map((offer) => {
              const shopInfo = shopLookup.get(String(offer.shopId)) || { id: offer.shopId, name: offer.shopName || 'Local shop', address: '', distanceKm: null }
              const isSelected = String(offer.id) === String(selectedOffer.id)
              return (
                <div key={offer.id} className={`rounded-2xl border p-3.5 ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-line bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{shopInfo.name || offer.shopName || 'Local shop'}</p>
                      {shopInfo.distanceKm != null && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><MapPin className="h-3 w-3" />{shopInfo.distanceKm.toFixed(1)} km away</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold">{formatCurrency(offer.price)}</p>
                      <p className="text-[11px] text-mute">{offer.available ? 'Available' : 'Unavailable'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button full variant={isSelected ? 'primary' : 'ghost'} onClick={() => setSelectedOfferId(offer.id)}>{isSelected ? 'Selected' : 'Select shop'}</Button>
                    <Link to={ROUTES.shop(offer.shopId)} state={{ shop: { id: offer.shopId, name: shopInfo.name || offer.shopName || 'Shop', address: shopInfo.address || '', distanceKm: shopInfo.distanceKm ?? null } }} className="flex h-11 flex-1 items-center justify-center rounded-full border border-line bg-white px-3 text-sm font-semibold text-ink active:bg-canvas">Browse catalogue</Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-line bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        {!selectedOffer.available ? (
          <Button full disabled>Currently unavailable</Button>
        ) : inCart > 0 ? (
          <div className="flex items-center gap-3">
            <QuantityStepper large value={inCart} disabled={busy} onChange={(n) => setQty(selectedOffer.id, n)} />
            <Link to={ROUTES.cart} className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand-600 font-semibold text-white active:bg-brand-700">View cart</Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <QuantityStepper large value={qty} min={1} onChange={(n) => setLocalQty(Math.max(1, n))} />
            <Button full loading={busy} onClick={() => add(selectedOffer, qty)}>Add to cart</Button>
          </div>
        )}
      </div>
    </div>
  )
}
