import { Minus, Plus } from 'lucide-react'

export default function QuantityStepper({ value, onChange, min = 0, max = 99, large = false, disabled = false }) {
  const h = large ? 'h-12' : 'h-11'
  const w = large ? 'w-12' : 'w-11'
  return (
    <div className={`inline-flex ${h} items-center rounded-full bg-accent-500 text-white`} role="group" aria-label="Quantity">
      <button type="button" disabled={disabled} onClick={() => onChange(value - 1)} aria-label="Decrease quantity"
        className={`grid ${h} ${w} place-items-center rounded-full active:bg-accent-600 disabled:opacity-60`} >
        <Minus className="h-4 w-4" />
      </button>
      <span className={`min-w-6 text-center font-bold tabular-nums ${large ? 'text-lg' : 'text-sm'}`} aria-live="polite">{value}</span>
      <button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label="Increase quantity"
        className={`grid ${h} ${w} place-items-center rounded-full active:bg-accent-600 disabled:opacity-60`}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
