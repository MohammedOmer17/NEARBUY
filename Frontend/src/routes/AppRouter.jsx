import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../config/routes'
import { ProtectedRoute, GuestRoute } from './ProtectedRoute'
import AuthLayout from '../layouts/AuthLayout'
import TabsLayout from '../layouts/TabsLayout'
import StackLayout from '../layouts/StackLayout'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import HomePage from '../features/customer/home/HomePage'
import ShopPage from '../features/customer/shops/ShopPage'
import ProductPage from '../features/customer/products/ProductPage'
import CartPage from '../features/customer/cart/CartPage'
import CheckoutPage from '../features/customer/checkout/CheckoutPage'
import OrdersPage from '../features/customer/orders/OrdersPage'
import OrderDetailPage from '../features/customer/orders/OrderDetailPage'
import NotificationsPage from '../features/customer/notifications/NotificationsPage'
import ProfilePage from '../features/customer/profile/ProfilePage'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<TabsLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.orders} element={<OrdersPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
        </Route>
        <Route element={<StackLayout />}>
          <Route path={ROUTES.shop()} element={<ShopPage />} />
          <Route path={ROUTES.product()} element={<ProductPage />} />
          <Route path={ROUTES.cart} element={<CartPage />} />
          <Route path={ROUTES.checkout} element={<CheckoutPage />} />
          <Route path={ROUTES.order()} element={<OrderDetailPage />} />
          <Route path={ROUTES.notifications} element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
