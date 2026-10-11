import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../services/apiClient'
import { ROUTES } from '../../config/routes'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const next = {}
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!form.password) next.password = 'Enter your password'
    setErrors(next)
    if (Object.keys(next).length) return
    setSubmitting(true)
    setServerError('')
    try {
      await login(form.email.trim(), form.password)
      navigate(location.state?.from || ROUTES.home, { replace: true })
    } catch (err) {
      setServerError(err.response?.status === 401 || err.response?.status === 400
        ? getErrorMessage(err, 'Email or password is incorrect.')
        : getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="mt-1 text-sm text-mute">Log in to order from shops near you.</p>
      </div>
      {serverError && <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger">{serverError}</p>}
      <Input label="Email" icon={Mail} type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
      <Input label="Password" icon={Lock} type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={set('password')} error={errors.password} />
      <Button type="submit" full loading={submitting}>Log in</Button>
      <p className="pt-2 text-center text-sm text-mute">
        New to NearBuy? <Link to={ROUTES.register} className="font-bold text-brand-600">Create an account</Link>
      </p>
    </form>
  )
}
