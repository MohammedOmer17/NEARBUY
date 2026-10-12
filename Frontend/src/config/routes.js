const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export const ROUTES = {
  login: '/login',
  register: '/register',
  home: '/customer/home',
  shop: (id = ':shopId') => `/customer/shops/${id}`,
  product: (id = ':productId') => `/customer/products/${id}`,
  cart: '/customer/cart',
  checkout: '/customer/checkout',
  orders: '/customer/orders',
  order: (id = ':orderId') => `/customer/orders/${id}`,
  notifications: '/customer/notifications',
  profile: '/customer/profile',
  ownerLogin: '/shop-owner/login',
  ownerRegister: '/shop-owner/register',
  ownerDashboard: '/shop-owner/dashboard',
  ownerOrders: '/shop-owner/orders',
  ownerProducts: '/shop-owner/products',
  ownerSales: '/shop-owner/sales',
  ownerProfile: '/shop-owner/profile',
  shopOwnerLogin: `${backendBase}/shop-owner/login`,
  captainLogin: `${backendBase}/captain/login`,
}
