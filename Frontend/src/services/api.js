import { apiClient } from './apiClient'
import {
  unwrap, normalizeProduct, normalizeShop, normalizeCart, normalizeOrder,
  normalizeNotification, normalizePaymentInfo,
} from './normalizers'

const list = (data, ...keys) => {
  const v = unwrap(data, ...keys)
  return Array.isArray(v) ? v : []
}

export const authApi = {
  profile: () => apiClient.get('/User/profile', { skipAuthEvent: true }).then((r) => unwrap(r.data, 'customer', 'user', 'data')),
  login: (body) => apiClient.post('/User/login', body, { skipAuthEvent: true }).then((r) => r.data),
  register: (body) => apiClient.post('/User/register', body, { skipAuthEvent: true }).then((r) => r.data),
  logout: () => apiClient.post('/User/logout', null, { skipAuthEvent: true }),
}

export const locationApi = {
  update: (latitude, longitude) => apiClient.patch('/User/location', { latitude, longitude }).then((r) => r.data),
}

export const shopApi = {
  // Only shop-discovery route in the backend. Request/response shape is adapted defensively.
  assess: (latitude, longitude) =>
    apiClient.post('/assessment/shops', { latitude, longitude }).then((r) =>
      list(r.data, 'shops', 'results', 'data').map(normalizeShop).filter((s) => s.id)),
  paymentInfo: (shopId) => apiClient.get(`/shop/${shopId}/payment`).then((r) => normalizePaymentInfo(r.data)),
}

export const productApi = {
  all: () => apiClient.get('/shop-products').then((r) => list(r.data, 'products', 'data').map(normalizeProduct)),
  byShop: (shopId) => apiClient.get(`/shop-products/shop/${shopId}`).then((r) => list(r.data, 'products', 'data').map(normalizeProduct)),
  one: (id) => apiClient.get(`/shop-products/${id}`).then((r) => normalizeProduct(unwrap(r.data, 'product', 'data'))),
}

export const cartApi = {
  get: () => apiClient.get('/cart').then((r) => normalizeCart(r.data)),
  add: (productId, quantity = 1) => apiClient.post('/cart', { productId, quantity }).then((r) => r.data),
  update: (productId, quantity) => apiClient.put(`/cart/${productId}`, { quantity }).then((r) => r.data),
  remove: (productId) => apiClient.delete(`/cart/${productId}`).then((r) => r.data),
  clear: () => apiClient.delete('/cart/clear').then((r) => r.data),
}

export const orderApi = {
  create: (payload) => apiClient.post('/orders', payload).then((r) => normalizeOrder(unwrap(r.data, 'order', 'data'))),
  list: () => apiClient.get('/orders').then((r) => list(r.data, 'orders', 'data').map(normalizeOrder)),
  get: (id) => apiClient.get(`/orders/${id}`).then((r) => normalizeOrder(unwrap(r.data, 'order', 'data'))),
  cancel: (id) => apiClient.put(`/orders/${id}/cancel`).then((r) => r.data),
  markPaid: (id) => apiClient.patch(`/orders/${id}/payment/mark-paid`).then((r) => r.data),
}

export const shopOwnerApi = {
  register: (body) => apiClient.post('/shop-owner/register', body, { skipAuthEvent: true }).then((r) => r.data),
  login: (body) => apiClient.post('/shop-owner/login', body, { skipAuthEvent: true }).then((r) => r.data),
  logout: () => apiClient.post('/shop-owner/logout', null, { skipAuthEvent: true }).then((r) => r.data),
  me: () => apiClient.get('/shop-owner/me', { skipAuthEvent: true }).then((r) => r.data),
  payment: () => apiClient.get('/shop-owner/payment', { skipAuthEvent: true }).then((r) => r.data),
  updatePayment: (body) => apiClient.patch('/shop-owner/payment', body, { skipAuthEvent: true }).then((r) => r.data),
  salesSummary: () => apiClient.get('/sales/summary').then((r) => r.data),
  salesStatistics: () => apiClient.get('/sales/statistics').then((r) => r.data),
  salesTrends: (period = 'daily') => apiClient.get('/sales/trends', { params: { period } }).then((r) => r.data),
  topProducts: () => apiClient.get('/sales/top-products').then((r) => r.data),
  listOrders: () => apiClient.get('/shop/orders').then((r) => r.data?.orders ?? []),
  getOrder: (id) => apiClient.get(`/shop/orders/${id}`).then((r) => r.data?.order ?? null),
  acceptOrder: (id) => apiClient.put(`/shop/orders/${id}/accept`).then((r) => r.data),
  updateOrderStatus: (id, status) => apiClient.put(`/shop/orders/${id}/status`, { status }).then((r) => r.data),
  confirmPayment: (id) => apiClient.patch(`/shop/orders/${id}/payment/confirm`).then((r) => r.data),
  confirmCodPayment: (id) => apiClient.patch(`/shop/orders/${id}/payment/confirm-cod`).then((r) => r.data),
  listProducts: async (shopId) => {
    if (!shopId) throw new Error('Shop ID is required')
    const res = await apiClient.get(`/shop-products/shop/${shopId}`)
    return res.data?.products ?? []
  },
  createProduct: (payload) => apiClient.post('/shop-products', payload).then((r) => r.data),
  updateProduct: (id, payload) => apiClient.put(`/shop-products/${id}`, payload).then((r) => r.data),
  deleteProduct: (id) => apiClient.delete(`/shop-products/${id}`).then((r) => r.data),
  updateStock: (id, quantity) => apiClient.patch(`/shop-products/${id}/stock`, { quantity }).then((r) => r.data),
}

export const notificationApi = {
  list: () => apiClient.get('/notifications/').then((r) => list(r.data, 'notifications', 'data').map(normalizeNotification)),
  unreadCount: () => apiClient.get('/notifications/unread-count').then((r) => {
    const d = r.data
    return Number(d?.count ?? d?.unreadCount ?? d?.data ?? 0) || 0
  }),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.patch('/notifications/read-all').then((r) => r.data),
  remove: (id) => apiClient.delete(`/notifications/${id}`).then((r) => r.data),
}
