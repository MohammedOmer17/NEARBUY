import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(function Input({ label, icon: Icon, error, type = 'text', ...rest }, ref) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{label}</span>
        <span className={`flex h-12 items-center gap-3 rounded-xl border bg-white px-3.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 ${error ? 'border-danger' : 'border-line'}`}>
          {Icon && <Icon className="h-5 w-5 shrink-0 text-mute" aria-hidden />}
          <input
            ref={ref}
            type={isPassword && show ? 'text' : type}
            aria-invalid={!!error}
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-mute/60"
            {...rest}
          />
          {isPassword && (
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="text-mute">
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </span>
      </label>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})

export default Input
