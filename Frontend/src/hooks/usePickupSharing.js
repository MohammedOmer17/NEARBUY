import { useCallback, useEffect, useRef, useState } from 'react'
import { createSocket } from '../services/socket'
import { geoErrorMessage } from '../utils/geo'

// Optional live location sharing for pickup orders, using the documented events:
// join_pickup_tracking, pickup_location_update, pickup_location_stop.
export function usePickupSharing(orderId, allowed) {
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')
  const watch = useRef(null)
  const socket = useRef(null)
  const lastSent = useRef(0)

  const stop = useCallback(() => {
    if (watch.current != null) { navigator.geolocation.clearWatch(watch.current); watch.current = null }
    if (socket.current) {
      socket.current.emit('pickup_location_stop', { orderId })
      socket.current.disconnect()
      socket.current = null
    }
    setSharing(false)
  }, [orderId])

  const start = useCallback(() => {
    setError('')
    if (!('geolocation' in navigator)) return setError(geoErrorMessage({ code: 0 }))
    const s = createSocket()
    socket.current = s
    s.on('connect', () => s.emit('join_pickup_tracking', { orderId })) // also re-joins after reconnect
    s.on('connect_error', () => setError('Live sharing lost its connection. It will retry automatically.'))
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        if (now - lastSent.current < 4000) return
        lastSent.current = now
        s.emit('pickup_location_update', { orderId, latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      },
      (err) => { setError(geoErrorMessage(err)); stop() },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    setSharing(true)
  }, [orderId, stop])

  useEffect(() => { if (!allowed && sharing) stop() }, [allowed, sharing, stop])
  const stopRef = useRef(stop)
  stopRef.current = stop
  useEffect(() => () => stopRef.current(), [])

  return { sharing, error, start, stop }
}
