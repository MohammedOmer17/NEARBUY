import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import { formatCurrency } from '../../utils/format'
import ProductImage from './ProductImage'
import AddControl from './AddControl'

export default function ProductCard({ product, showShop = false }) {
  return (
    <article className="flex flex-col rounded-2xl bg-white p-2.5 shadow-card">
      <Link to={ROUTES.product(product.id)} className="block">
        <div className="aspect-square overflow-hidden rounded-xl bg-brand-50/60">
          <ProductImage src={product.image} alt={product.name} className="h-full w-full p-2" />
        </div>
        <h3 className="mt-2.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</h3>
        <p className="mt-0.5 truncate text-xs text-mute">{showShop && product.shopName ? product.shopName : product.unit}</p>
      </Link>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold">{formatCurrency(product.price)}</span>
        <AddControl product={product} />
      </div>
    </article>
  )
}
