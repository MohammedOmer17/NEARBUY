import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { locationApi } from '../services/api'
import { getErrorMessage } from '../services/apiClient'
import { getPosition, geoErrorMessage, isValidCoordinate } from '../utils/geo'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const { customer, updateCustomer } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const saved = customer?.location
  const location = isValidCoordinate(saved?.latitude, saved?.longitude)
    ? { latitude: saved.latitude, longitude: saved.longitude, updatedAt: customer.locationUpdatedAt }
    : null

  // Permission is only requested here, after an explicit tap.
  const detectAndSave = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const pos = await getPosition()
      const { latitude, longitude } = pos.coords
      if (!isValidCoordinate(latitude, longitude)) throw new Error('Received an invalid location.')
      await locationApi.update(latitude, longitude)
      updateCustomer({ location: { latitude, longitude }, locationUpdatedAt: new Date().toISOString() })
      setOpen(false)
      toast.success('Location updated')
    } catch (e) {
      setError(e?.response ? getErrorMessage(e) : geoErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }, [toast, updateCustomer])

  const value = useMemo(() => ({
    location, openSheet: () => { setError(''); setOpen(true) },
  }), [location?.latitude, location?.longitude, location?.updatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LocationContext.Provider value={value}>
      {children}
      <Modal open={open} onClose={() => setOpen(false)} title={location ? 'Update your location' : 'Set your location'}
        footer={(
          <>
            <Button full loading={busy} onClick={detectAndSave}>Use my current location</Button>
            <Button full variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
          </>
        )}>
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><MapPin className="h-6 w-6" /></div>
        <p>NearBuy uses your location to find kirana shops close to you. We only ask when you tap the button below.</p>
        {error && <p role="alert" className="mt-3 rounded-xl bg-danger-50 p-3 text-sm text-danger">{error}</p>}
      </Modal>
    </LocationContext.Provider>
  )
}

export const useLocation = () => useContext(LocationContext)
