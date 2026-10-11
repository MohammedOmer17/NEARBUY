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
}
