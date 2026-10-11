import { Outlet, useLocation } from 'react-router-dom'
import PhoneFrame from './PhoneFrame'
import CartBar from '../components/shared/CartBar'
import { ROUTES } from '../config/routes'

export default function StackLayout() {
  const { pathname } = useLocation()
  const showCartBar = pathname.startsWith('/customer/shops/')
  return (
    <PhoneFrame className={showCartBar ? 'pb-24' : ''}>
      <Outlet />
      {showCartBar && <CartBar bottom={0} />}
    </PhoneFrame>
  )
}
