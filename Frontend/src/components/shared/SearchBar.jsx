import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search', className = '' }) {
  return (
    <div className={`flex h-12 items-center gap-3 rounded-2xl bg-white px-4 shadow-card ${className}`}>
      <Search className="h-5 w-5 shrink-0 text-mute" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-mute/70 [&::-webkit-search-cancel-button]:hidden" />
      {value && <button onClick={() => onChange('')} aria-label="Clear search" className="text-mute"><X className="h-5 w-5" /></button>}
    </div>
  )
}
