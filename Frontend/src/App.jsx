import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { OwnerAuthProvider } from './context/OwnerAuthContext'
import { LocationProvider } from './context/LocationContext'
import { CartProvider } from './context/CartContext'
import { NotificationProvider } from './context/NotificationContext'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <OwnerAuthProvider>
            <LocationProvider>
              <CartProvider>
                <NotificationProvider>
                  <AppRouter />
                </NotificationProvider>
              </CartProvider>
            </LocationProvider>
          </OwnerAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
