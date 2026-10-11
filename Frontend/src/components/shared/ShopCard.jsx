import { Link } from 'react-router-dom'
import { Store, MapPin } from 'lucide-react'
import { ROUTES } from '../../config/routes'
import { assetUrl } from '../../utils/format'

export default function ShopCard({ shop, className = '' }) {
  return (
    <Link to={ROUTES.shop(shop.id)} state={{ shop }} className={`block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.99] ${className}`}>
      <div className="grid h-24 place-items-center bg-linear-to-br from-brand-100 to-brand-50 text-brand-500">
        {shop.image ? <img src={assetUrl(shop.image)} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Store className="h-9 w-9" aria-hidden />}
      </div>
      <div className="p-3">
        <h3 className="truncate text-[15px] font-bold">{shop.name}</h3>
        {shop.address && <p className="mt-0.5 line-clamp-1 text-xs text-mute">{shop.address}</p>}
        {shop.distanceKm != null && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
            <MapPin className="h-3 w-3" aria-hidden />{shop.distanceKm.toFixed(1)} km
          </p>
        )}
      </div>
    </Link>
  )
}
