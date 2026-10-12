import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useOwnerAuth } from '../../context/OwnerAuthContext'
import { ROUTES } from '../../config/routes'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { getErrorMessage } from '../../services/apiClient'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function OwnerLoginPage() {
  const { login } = useOwnerAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!EMAIL_RE.test(form.email.trim())) nextErrors.email = 'Enter a valid email address'
    if (!form.password) nextErrors.password = 'Enter your password'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    setServerError('')
    try {
      await login(form.email.trim(), form.password)
      navigate(ROUTES.ownerDashboard, { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Unable to log in as shop owner.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">NearBuy</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Shop Owner</h1>
          <p className="mt-2 text-sm text-mute">Manage your shop, orders, and sales.</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {serverError && <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger">{serverError}</p>}
          <Input label="Email" icon={Mail} type="email" autoComplete="email" placeholder="owner@example.com" value={form.email} onChange={handleChange('email')} error={errors.email} />
          <Input label="Password" icon={Lock} type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={handleChange('password')} error={errors.password} />
          <Button type="submit" full loading={submitting}>Log in</Button>
        </form>

        <p className="mt-4 text-center text-sm text-mute">
          Need an account? <Link to={ROUTES.ownerRegister} className="font-bold text-brand-600">Register</Link>
        </p>
      </div>
    </div>
  )
}
