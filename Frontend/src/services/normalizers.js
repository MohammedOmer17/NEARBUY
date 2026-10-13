// The backend returns Mongoose documents. These adapters turn them into the
// flat shapes the UI uses, and tolerate populated or unpopulated references.
const refId = (v) => (v && typeof v === 'object' ? v._id || v.id : v)
const asObj = (v) => (v && typeof v === 'object' ? v : null)

export function unwrap(data, ...keys) {
  for (const k of keys) if (data?.[k] !== undefined) return data[k]
  return data
}

export function normalizeProduct(p) {
  const shop = asObj(p.shop)
  return {
    id: p._id || p.id,
    shopId: refId(p.shop),
    shopName: shop?.shopName || shop?.name || '',
    name: p.name || '',
    description: p.description || '',
    category: p.category || '',
    brand: p.brand || '',
    image: p.image || '',
    price: Number(p.price) || 0,
    unit: p.unit || '',
    packSize: p.packSize || '',
    variant: p.variant || '',
    barcode: p.barcode || p.gtin || '',
    // Only availability is exposed. Stock quantity is deliberately dropped.
    available: p.isAvailable !== false,
  }
}

const identityPart = (value) => String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')

export function getProductIdentityKey(product = {}) {
  const barcode = identityPart(product.barcode || product.gtin)
  if (barcode) return `barcode:${barcode}`

  const name = identityPart(product.name)
  const brand = identityPart(product.brand)
  const category = identityPart(product.category)
  const unit = identityPart(product.unit)
  const packSize = identityPart(product.packSize)
  const variant = identityPart(product.variant)

  // The current backend has no canonical product ID. Avoid merging by name alone.
  if (!name || !unit || (!brand && !category && !packSize && !variant)) return ''
  return [name, brand, brand ? '' : category, unit, packSize, variant].join('|')
}

export function groupProductsByIdentity(products = []) {
  const groups = new Map()

  for (const [index, product] of products.entries()) {
    const key = getProductIdentityKey(product)
    const groupKey = key || `unmatched:${product.id || index}`
    if (!groups.has(groupKey)) groups.set(groupKey, { key: groupKey, offers: [] })
    groups.get(groupKey).offers.push(product)
  }

  return [...groups.values()].map(({ key, offers }) => {
    const ordered = [...offers].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
    const canonical = ordered[0] || offers[0]

    return {
      ...canonical,
      key,
      offers: ordered,
      offerCount: ordered.length,
    }
  })
}

export function normalizeShop(item) {
  const s = asObj(item?.shop) || item || {}
  const km = item?.distanceKm ?? item?.distanceInKm ?? s.distanceKm
  return {
    id: s._id || s.id,
    name: s.shopName || s.name || 'Shop',
    address: s.address || '',
    image: s.image || s.logo || '',
    distanceKm: typeof km === 'number' ? km : null,
    location: s.location || null,
  }
}

export function normalizeCart(data) {
  const cart = unwrap(data, 'cart', 'data') || {}
  const shop = asObj(cart.shop)
  const items = (cart.items || []).map((i) => {
    const p = asObj(i.product) || {}
    return {
      productId: p._id || p.id || refId(i.product) || i.productId,
      name: i.name || p.name || 'Item',
      image: i.image || p.image || '',
      unit: i.unit || p.unit || '',
      price: Number(i.price ?? p.price) || 0,
      quantity: Number(i.quantity) || 0,
    }
  })
  return {
    shopId: refId(cart.shop) || null,
    shopName: shop?.shopName || shop?.name || '',
    items,
  }
}

export function normalizeOrder(o) {
  const shop = asObj(o.shop)
  const addr = o.deliveryAddress
  return {
    id: o._id || o.id,
    shopId: refId(o.shop),
    shopName: shop?.shopName || shop?.name || 'Shop',
    shopAddress: shop?.address || '',
    shopLocation: shop?.location || null,
    items: (o.items || []).map((i) => ({
      name: i.name || asObj(i.product)?.name || 'Item',
      quantity: Number(i.quantity) || 0,
      price: Number(i.price) || 0,
      unit: i.unit || '',
    })),
    totalAmount: Number(o.totalAmount) || 0,
    fulfillmentType: o.fulfillmentType,
    status: o.orderStatus,
    paymentMethod: o.payment?.method,
    paymentStatus: o.payment?.status,
    deliveryAddress: typeof addr === 'string' ? addr : addr?.address || '',
    createdAt: o.createdAt,
  }
}

export function normalizeNotification(n) {
  return {
    id: n._id || n.id,
    title: n.title || 'Notification',
    message: n.message || '',
    isRead: !!n.isRead,
    createdAt: n.createdAt,
  }
}

export function normalizePaymentInfo(data) {
  const d = unwrap(data, 'paymentDetails', 'payment', 'data') || {}
  const nested = asObj(d.paymentDetails) || d
  return { upiId: nested.upiId || '', qrCode: nested.qrCode || '' }
}
