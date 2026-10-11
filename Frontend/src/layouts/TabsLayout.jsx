import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, ReceiptText, User } from 'lucide-react'
import PhoneFrame from './PhoneFrame'
import CartBar from '../components/shared/CartBar'
import { useCart } from '../context/CartContext'
import { ROUTES } from '../config/routes'

const TABS = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.orders, label: 'Orders', icon: ReceiptText },
  { to: ROUTES.profile, label: 'Profile', icon: User },
]

export default function TabsLayout() {
  const { pathname } = useLocation()
  const { itemCount } = useCart()
  const barSpace = pathname.startsWith(ROUTES.home) && itemCount > 0
  return (
    <PhoneFrame className={barSpace ? 'pb-[calc(8.5rem+env(safe-area-inset-bottom))]' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]'}>
      <Outlet />
      {pathname.startsWith(ROUTES.home) && <CartBar />}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Main">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition ${isActive ? 'text-brand-600' : 'text-mute'}`}>
            <Icon className="h-6 w-6" />{label}
          </NavLink>
        ))}
      </nav>
    </PhoneFrame>
  )
}
