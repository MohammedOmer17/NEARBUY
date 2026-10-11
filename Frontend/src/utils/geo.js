export const isValidCoordinate = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject({ code: 0 })
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 })
  })
}

export function geoErrorMessage(err) {
  switch (err?.code) {
    case 1: return 'Location access is blocked. Allow it in your browser settings, then try again.'
    case 2: return 'Your device could not find its location. Move to an open area and try again.'
    case 3: return 'Finding your location took too long. Try again.'
    case 0: return 'This browser cannot share your location.'
    default: return err?.message || 'Could not get your location.'
  }
}
