import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../services/apiClient'
import { ROUTES } from '../../config/routes'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const phone = form.phone.replace(/[\s-]/g, '')
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Enter your full name'
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!/^\+?\d{10,14}$/.test(phone)) next.phone = 'Enter a valid phone number'
    if (form.password.length < 6) next.password = 'Use at least 6 characters'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    setServerError('')
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone, password: form.password })
      navigate(ROUTES.home, { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="mt-1 text-sm text-mute">It takes a minute. Then you can start ordering.</p>
      </div>
      {serverError && <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger">{serverError}</p>}
      <Input label="Full name" icon={User} autoComplete="name" placeholder="Your name" value={form.name} onChange={set('name')} error={errors.name} />
      <Input label="Email" icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
      <Input label="Phone number" icon={Phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="10-digit mobile number" value={form.phone} onChange={set('phone')} error={errors.phone} />
      <Input label="Password" icon={Lock} type="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={set('password')} error={errors.password} />
      <Button type="submit" full loading={submitting}>Create account</Button>
      <p className="pt-2 text-center text-sm text-mute">
        Already registered? <Link to={ROUTES.login} className="font-bold text-brand-600">Log in</Link>
      </p>
    </form>
  )
}
