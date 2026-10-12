import { API_BASE_URL } from '../config/env'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
export const formatCurrency = (n) => inr.format(Number(n) || 0).replace(/\.00$/, '')

export function normalizeUnitLabel(unit = '') {
  const value = String(unit ?? '').trim().toLowerCase()
  const labels = {
    kg: 'kg',
    g: 'g',
    ltr: 'L',
    ml: 'mL',
    packet: 'pack',
    pack: 'pack',
    piece: 'piece',
    pieces: 'piece',
  }
  return labels[value] || value || ''
}

export function formatItemQuantity(quantity, unit, name = '') {
  const qty = Number(quantity) || 0
  const label = normalizeUnitLabel(unit)
  const itemName = name ? ` ${name}` : ''

  if (!label) return `${qty}${itemName}`
  return `${qty} ${label}${itemName}`
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function assetUrl(path) {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export function qrSrc(qr) {
  if (!qr) return ''
  if (/^(https?:|data:)/.test(qr) || qr.startsWith('/')) return assetUrl(qr)
  return `data:image/png;base64,${qr}`
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'N'
