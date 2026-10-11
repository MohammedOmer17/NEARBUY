import { useState } from 'react'
import { Package } from 'lucide-react'
import { assetUrl } from '../../utils/format'

export default function ProductImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className={`grid place-items-center bg-brand-50 text-brand-200 ${className}`}><Package className="h-1/3 w-1/3" aria-hidden /></div>
  }
  return <img src={assetUrl(src)} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-contain ${className}`} />
}
