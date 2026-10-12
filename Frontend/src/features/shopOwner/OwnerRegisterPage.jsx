import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Mail, Lock, User, Phone, Store, Navigation } from 'lucide-react'
import { useOwnerAuth } from '../../context/OwnerAuthContext'
import { ROUTES } from '../../config/routes'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { getErrorMessage } from '../../services/apiClient'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  shopName: '',
  address: '',
  contact: '',
  latitude: '',
  longitude: '',
}

export default function OwnerRegisterPage() {
  const { register } = useOwnerAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const onSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}
    Object.entries(form).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() === '' && !['latitude', 'longitude'].includes(key)) {
        nextErrors[key] = 'This field is required'
      }
    })

    if (!EMAIL_RE.test(form.email.trim())) nextErrors.email = 'Enter a valid email address'
    if (!Number.isFinite(Number(form.latitude)) || !Number.isFinite(Number(form.longitude))) {
      nextErrors.latitude = 'Use valid coordinates'
      nextErrors.longitude = 'Use valid coordinates'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    setServerError('')
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        shopName: form.shopName.trim(),
        address: form.address.trim(),
        contact: form.contact.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      })
      navigate(ROUTES.ownerDashboard, { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Unable to create the shop owner account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-canvas px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
        <div className="mb-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">NearBuy</p>
          <h1 className="mt-2 text-3xl font-bold">Create shop account</h1>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {serverError && <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger">{serverError}</p>}
          <Input label="Owner name" icon={User} placeholder="Aman Verma" value={form.name} onChange={updateField('name')} error={errors.name} />
          <Input label="Email" icon={Mail} type="email" placeholder="owner@example.com" value={form.email} onChange={updateField('email')} error={errors.email} />
          <Input label="Phone" icon={Phone} placeholder="+91 98765 43210" value={form.phone} onChange={updateField('phone')} error={errors.phone} />
          <Input label="Password" icon={Lock} type="password" placeholder="Create a password" value={form.password} onChange={updateField('password')} error={errors.password} />
          <Input label="Shop name" icon={Store} placeholder="Fresh Basket" value={form.shopName} onChange={updateField('shopName')} error={errors.shopName} />
          <Input label="Shop address" icon={MapPin} placeholder="12 Market Road" value={form.address} onChange={updateField('address')} error={errors.address} />
          <Input label="Contact number" icon={Phone} placeholder="+91 98765 43210" value={form.contact} onChange={updateField('contact')} error={errors.contact} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Latitude" icon={Navigation} type="number" step="0.000001" placeholder="19.0760" value={form.latitude} onChange={updateField('latitude')} error={errors.latitude} />
            <Input label="Longitude" icon={Navigation} type="number" step="0.000001" placeholder="72.8777" value={form.longitude} onChange={updateField('longitude')} error={errors.longitude} />
          </div>
          <Button type="submit" full loading={submitting}>Register shop</Button>
        </form>

        <p className="mt-4 text-center text-sm text-mute">
          Already have an account? <Link to={ROUTES.ownerLogin} className="font-bold text-brand-600">Log in</Link>
        </p>
      </div>
    </div>
  )
}
