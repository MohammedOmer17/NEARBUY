import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({ title, back = true, fallback = '/customer/home', right }) {
  const navigate = useNavigate()
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(fallback))
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-white/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur">
      {back && (
        <button onClick={goBack} aria-label="Go back" className="grid h-10 w-10 place-items-center rounded-full active:bg-canvas"><ChevronLeft className="h-6 w-6" /></button>
      )}
      <h1 className={`min-w-0 flex-1 truncate text-lg font-bold ${back ? '' : 'pl-2'}`}>{title}</h1>
      {right}
    </header>
  )
}
