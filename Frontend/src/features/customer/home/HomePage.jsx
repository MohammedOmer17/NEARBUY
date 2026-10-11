import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, MapPin, ShoppingBag, SearchX, Store } from 'lucide-react'
import { useLocation } from '../../../context/LocationContext'
import { useCart } from '../../../context/CartContext'
import { useNotifications } from '../../../context/NotificationContext'
import { useAsync } from '../../../hooks/useAsync'
import { productApi, shopApi } from '../../../services/api'
import { ROUTES } from '../../../config/routes'
import { formatDateTime } from '../../../utils/format'
import SearchBar from '../../../components/shared/SearchBar'
import CategoryChips from '../../../components/shared/CategoryChips'
import ShopCard from '../../../components/shared/ShopCard'
import ProductCard from '../../../components/shared/ProductCard'
import { ProductGridSkeleton } from '../../../components/ui/Skeleton'
import Skeleton from '../../../components/ui/Skeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'
import Button from '../../../components/ui/Button'

// Shops that sell something, built from product data when the assessment route returns nothing.
function shopsFromProducts(products) {
  const map = new Map()
  products.forEach((p) => {
    if (p.shopId && !map.has(p.shopId)) map.set(p.shopId, { id: p.shopId, name: p.shopName || 'Local shop', address: '', image: '', distanceKm: null })
  })
  return [...map.values()]
}

const matches = (q, ...fields) => fields.some((f) => f?.toLowerCase().includes(q))

export default function HomePage() {
  const { location, openSheet } = useLocation()
  const { itemCount } = useCart()
  const { unread } = useNotifications()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  const products = useAsync(() => productApi.all(), [])
  const shops = useAsync(() => shopApi.assess(location.latitude, location.longitude), [location?.latitude, location?.longitude], { enabled: !!location })

  const allShops = useMemo(() => {
    if (shops.data?.length) return shops.data
    return shopsFromProducts(products.data || [])
  }, [shops.data, products.data])

  const categories = useMemo(() => [...new Set((products.data || []).map((p) => p.category).filter(Boolean))], [products.data])

  const q = query.trim().toLowerCase()
  const visibleShops = q ? allShops.filter((s) => matches(q, s.name, s.address)) : allShops
  const visibleProducts = (products.data || []).filter((p) =>
    (!category || p.category === category) && (!q || matches(q, p.name, p.brand, p.category)))

  const loading = products.loading
  const noResults = !loading && q && !visibleShops.length && !visibleProducts.length

  return (
    <div>
      <header className="rounded-b-[28px] bg-linear-to-br from-brand-900 to-brand-600 px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between">
          <button onClick={openSheet} className="min-w-0 text-left" aria-label="Change location">
            <span className="flex items-center gap-1 text-xs font-medium text-white/70"><MapPin className="h-3.5 w-3.5" />Deliver to</span>
            <span className="flex items-center gap-1 text-lg font-bold">
              {location ? 'Current location' : 'Set your location'}<ChevronDown className="h-5 w-5" />
            </span>
            {location?.updatedAt && <span className="block text-xs text-white/60">Updated {formatDateTime(location.updatedAt)}</span>}
          </button>
          <div className="flex items-center gap-1">
            <Link to={ROUTES.cart} aria-label={`Cart, ${itemCount} items`} className="relative grid h-11 w-11 place-items-center rounded-full bg-white/10 active:bg-white/20">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold">{itemCount}</span>}
            </Link>
            <Link to={ROUTES.notifications} aria-label={`Notifications, ${unread} unread`} className="relative grid h-11 w-11 place-items-center rounded-full bg-white/10 active:bg-white/20">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold">{unread > 9 ? '9+' : unread}</span>}
            </Link>
          </div>
        </div>
        <SearchBar className="mt-4 text-ink" value={query} onChange={setQuery} placeholder="Search products or shops" />
      </header>

      <div className="space-y-6 px-4 pb-6 pt-5">
        {!location && (
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><MapPin className="h-5 w-5" /></div>
            <p className="flex-1 text-sm font-medium">Set your location to see shops near you.</p>
            <Button size="sm" onClick={openSheet}>Set</Button>
          </div>
        )}

        {products.error && !products.data ? (
          <ErrorState error={products.error} onRetry={products.reload} title="Could not load shops and products" />
        ) : noResults ? (
          <EmptyState icon={SearchX} title="No matches found" text={`Nothing matched "${query}". Try a different word.`}
            action={<Button variant="soft" onClick={() => setQuery('')}>Clear search</Button>} />
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-bold">Nearby shops</h2>
              {loading || (shops.loading && !allShops.length) ? (
                <div className="flex gap-3 overflow-hidden"><Skeleton className="h-44 w-56 shrink-0" /><Skeleton className="h-44 w-56 shrink-0" /></div>
              ) : visibleShops.length ? (
                <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
                  {visibleShops.map((s) => <ShopCard key={s.id} shop={s} className="w-56 shrink-0 snap-start" />)}
                </div>
              ) : (
                <EmptyState icon={Store} title="No shops nearby yet" text="No shops are available right now. Check back soon." />
              )}
            </section>

            {(loading || visibleProducts.length > 0 || category) && (
              <section>
                <h2 className="mb-3 text-lg font-bold">{q ? 'Products' : 'Popular products'}</h2>
                <CategoryChips categories={categories} value={category} onChange={setCategory} />
                <div className="mt-3">
                  {loading ? <ProductGridSkeleton /> : visibleProducts.length ? (
                    <div className="grid grid-cols-2 gap-3">
                      {visibleProducts.map((p) => <ProductCard key={p.id} product={p} showShop />)}
                    </div>
                  ) : (
                    <EmptyState title="No products in this category" />
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
