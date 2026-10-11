import { Check, XCircle } from 'lucide-react'
import { timelineFor } from '../../utils/orderMeta'

export default function OrderTimeline({ order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-danger-50 p-4 text-danger">
        <XCircle className="h-6 w-6" /><p className="font-semibold">This order was cancelled</p>
      </div>
    )
  }
  const { steps, current } = timelineFor(order)
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const done = i < current || (current === steps.length - 1 && i === current)
        const active = i === current && !done
        return (
          <li key={s.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${done ? 'border-ok bg-ok text-white' : active ? 'border-brand-600 bg-white' : 'border-line bg-white'}`}>
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : active ? <span className="h-2 w-2 rounded-full bg-brand-600" /> : null}
              </span>
              {i < steps.length - 1 && <span className={`my-0.5 w-0.5 flex-1 ${i < current ? 'bg-ok' : 'bg-line'}`} style={{ minHeight: 22 }} />}
            </div>
            <p className={`pb-4 text-[15px] ${active ? 'font-bold text-brand-700' : done ? 'font-semibold' : 'text-mute'}`}>{s.label}</p>
          </li>
        )
      })}
    </ol>
  )
}
