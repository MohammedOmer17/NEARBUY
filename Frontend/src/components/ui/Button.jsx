import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-accent-500 text-white active:bg-accent-600 shadow-[0_6px_16px_rgb(233_30_120/0.28)]',
  brand: 'bg-brand-600 text-white active:bg-brand-700',
  soft: 'bg-brand-50 text-brand-700 active:bg-brand-100',
  outline: 'border border-line bg-white text-ink active:bg-canvas',
  danger: 'border border-danger/30 bg-white text-danger active:bg-danger-50',
  ghost: 'text-brand-700 active:bg-brand-50',
}
const sizes = { md: 'min-h-12 px-6 py-2 text-[15px]', sm: 'min-h-11 px-4 py-2 text-sm', icon: 'h-11 w-11' }

export default function Button({ variant = 'primary', size = 'md', loading = false, full = false, className = '', children, disabled, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex min-w-0 shrink-0 items-center justify-center gap-2 rounded-full text-center font-semibold transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
