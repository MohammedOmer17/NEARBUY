import { useMemo, useState } from 'react'
import { useLocation as useRouterLocation, useParams } from 'react-router-dom'
import { MapPin, PackageSearch, Store } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { productApi } from '../../../services/api'
import PageHeader from '../../../components/shared/PageHeader'
import SearchBar from '../../../components/shared/SearchBar'
import CategoryChips from '../../../components/shared/CategoryChips'
import ProductCard from '../../../components/shared/ProductCard'
import { ProductGridSkeleton } from '../../../components/ui/Skeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorState from '../../../components/ui/ErrorState'

export default function ShopPage() {
  const { shopId } = useParams()
  const { state } = useRouterLocation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const { data: products, loading, error, reload } = useAsync(() => productApi.byShop(shopId), [shopId])

  const shop = useMemo(() => {
    const fromNav = state?.shop
    return { name: fromNav?.name || products?.[0]?.shopName || 'Shop', address: fromNav?.address || '', distanceKm: fromNav?.distanceKm ?? null }
  }, [state, products])

  const categories = useMemo(() => [...new Set((products || []).map((p) => p.category).filter(Boolean))], [products])
  const q = query.trim().toLowerCase()
  const visible = (products || []).filter((p) =>
    (!category || p.category === category) && (!q || [p.name, p.brand, p.category, p.unit, p.packSize, p.variant].some((f) => f?.toLowerCase().includes(q))))

  return (
    <div>
      <PageHeader title={shop.name} />
      <div className="px-4 pb-6 pt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-100 to-brand-50 text-brand-600"><Store className="h-7 w-7" /></div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{shop.name}</h2>
            {shop.address && <p className="line-clamp-2 text-xs text-mute">{shop.address}</p>}
            {shop.distanceKm != null && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><MapPin className="h-3 w-3" />{shop.distanceKm.toFixed(1)} km away</p>}
          </div>
        </div>

        <SearchBar className="mt-4" value={query} onChange={setQuery} placeholder="Search in this shop" />
        <div className="mt-3"><CategoryChips categories={categories} value={category} onChange={setCategory} /></div>

        <div className="mt-4">
          {loading ? <ProductGridSkeleton /> : error ? <ErrorState error={error} onRetry={reload} title="Could not load this shop" />
            : visible.length ? (
              <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            ) : (
              <EmptyState icon={PackageSearch} title={q || category ? 'No matching products' : 'No products yet'}
                text={q || category ? 'Try a different search or category.' : 'This shop has not listed any products.'} />
            )}
        </div>
      </div>
    </div>
  )
}
