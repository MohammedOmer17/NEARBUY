import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOwnerAuth } from '../context/OwnerAuthContext'
import { ROUTES } from '../config/routes'

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-brand-900 text-white">
      <span className="animate-pulse text-3xl font-extrabold tracking-tight">NearBuy</span>
    </div>
  )
}

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status === 'guest') return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function GuestRoute() {
  const { status } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'authed') return <Navigate to={ROUTES.home} replace />
  return <Outlet />
}

export function OwnerProtectedRoute() {
  const { status } = useOwnerAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status === 'guest') return <Navigate to={ROUTES.ownerLogin} replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function OwnerGuestRoute() {
  const { status } = useOwnerAuth()
  if (status === 'loading') return <Splash />
  if (status === 'authed') return <Navigate to={ROUTES.ownerDashboard} replace />
  return <Outlet />
}
