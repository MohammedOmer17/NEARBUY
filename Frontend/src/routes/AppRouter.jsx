import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../config/routes'
import { ProtectedRoute, GuestRoute, OwnerProtectedRoute, OwnerGuestRoute } from './ProtectedRoute'
import AuthLayout from '../layouts/AuthLayout'
import TabsLayout from '../layouts/TabsLayout'
import StackLayout from '../layouts/StackLayout'
import OwnerShell from '../layouts/OwnerShell'
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
import OwnerLoginPage from '../features/shopOwner/OwnerLoginPage'
import OwnerRegisterPage from '../features/shopOwner/OwnerRegisterPage'
import OwnerDashboardPage from '../features/shopOwner/OwnerDashboardPage'
import OwnerOrdersPage from '../features/shopOwner/OwnerOrdersPage'
import OwnerProductsPage from '../features/shopOwner/OwnerProductsPage'
import OwnerSalesPage from '../features/shopOwner/OwnerSalesPage'
import OwnerProfilePage from '../features/shopOwner/OwnerProfilePage'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<OwnerGuestRoute />}>
        <Route path={ROUTES.ownerLogin} element={<OwnerLoginPage />} />
        <Route path={ROUTES.ownerRegister} element={<OwnerRegisterPage />} />
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

      <Route element={<OwnerProtectedRoute />}>
        <Route element={<OwnerShell />}>
          <Route path={ROUTES.ownerDashboard} element={<OwnerDashboardPage />} />
          <Route path={ROUTES.ownerOrders} element={<OwnerOrdersPage />} />
          <Route path={ROUTES.ownerProducts} element={<OwnerProductsPage />} />
          <Route path={ROUTES.ownerSales} element={<OwnerSalesPage />} />
          <Route path={ROUTES.ownerProfile} element={<OwnerProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
