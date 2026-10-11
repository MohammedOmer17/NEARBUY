export const TERMINAL = ['completed', 'cancelled']

export const STATUS_LABEL = {
  placed: 'Order placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked up',
  out_for_delivery: 'Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const DELIVERY = [
  { key: 'placed', label: 'Order placed' },
  { key: 'accepted', label: 'Accepted by shop' },
  { key: 'preparing', label: 'Being prepared' },
  { key: 'ready', label: 'Ready for Captain' },
  { key: 'out_for_delivery', label: 'Out for delivery', alias: ['picked_up'] },
  { key: 'completed', label: 'Delivered' },
]
const PICKUP = [
  { key: 'placed', label: 'Order placed' },
  { key: 'accepted', label: 'Accepted by shop' },
  { key: 'preparing', label: 'Being prepared' },
  { key: 'ready', label: 'Ready to collect' },
  { key: 'completed', label: 'Collected' },
]

export function timelineFor(order) {
  const steps = order.fulfillmentType === 'delivery' ? DELIVERY : PICKUP
  const idx = steps.findIndex((s) => s.key === order.status || s.alias?.includes(order.status))
  return { steps, current: idx }
}

export const PAYMENT_METHOD_LABEL = { shop_upi: 'Shop UPI', cod: 'Cash on Delivery' }
export const PAYMENT_STATUS_LABEL = {
  pending: 'Payment pending',
  customer_marked_paid: 'Awaiting shop confirmation',
  paid: 'Paid',
}
