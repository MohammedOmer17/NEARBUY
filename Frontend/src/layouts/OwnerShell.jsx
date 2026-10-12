import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Package2, ShoppingBag, Store, UserCircle2 } from 'lucide-react'
import PhoneFrame from './PhoneFrame'
import { ROUTES } from '../config/routes'

const NAV_ITEMS = [
  { to: ROUTES.ownerDashboard, label: 'Dashboard', icon: BarChart3 },
  { to: ROUTES.ownerOrders, label: 'Orders', icon: ShoppingBag },
  { to: ROUTES.ownerProducts, label: 'Products', icon: Package2 },
  { to: ROUTES.ownerSales, label: 'Sales', icon: BarChart3 },
  { to: ROUTES.ownerProfile, label: 'Profile', icon: UserCircle2 },
]

export default function OwnerShell() {
  return (
    <PhoneFrame className="pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Shop owner navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? 'text-brand-600' : 'text-mute'}`}>
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </PhoneFrame>
  )
}
