import { STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../../utils/orderMeta'

const TONES = {
  ok: 'bg-ok-50 text-ok', warn: 'bg-warn-50 text-warn', danger: 'bg-danger-50 text-danger', brand: 'bg-brand-50 text-brand-700',
}
export function OrderStatusBadge({ status }) {
  const tone = status === 'completed' ? 'ok' : status === 'cancelled' ? 'danger' : 'brand'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>{STATUS_LABEL[status] || status}</span>
}
export function PaymentStatusBadge({ status }) {
  const tone = status === 'paid' ? 'ok' : 'warn'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>{PAYMENT_STATUS_LABEL[status] || status}</span>
}
