import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthError } from '@/services/auth/authError'
import { signIn } from '@/services/auth/authService'
import { useSessionStore } from '@/store/sessionStore'
import { AuthLayout } from './AuthLayout'
import { signInSchema, type SignInValues } from './signInSchema'

// Only the first message is designed (Figma). The rest are placeholder copy
// for undesigned states, same as the mobile app.
function errorMessage(error: unknown): string {
  const kind = error instanceof AuthError ? error.kind : 'unknown'
  switch (kind) {
    case 'invalid_credentials':
      return 'Incorrect email or password. Please try again.'
    case 'deactivated':
      return 'Your account is deactivated. Contact your administrator.'
    case 'rate_limited': {
      const seconds = error instanceof AuthError ? (error.retryAfterSeconds ?? 0) : 0
      return `Too many attempts. Try again in ${Math.max(1, Math.ceil(seconds / 60))} min.`
    }
    case 'network':
      return 'Can’t reach the server. Check your connection and try again.'
    default:
      return 'Something went wrong. Try again.'
  }
}

const fieldClass = (invalid: boolean) =>
  `block w-full rounded-lg border bg-input px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-3/70 focus:ring-2 focus:ring-primary/30 ${
    invalid ? 'border-input-error' : 'border-line focus:border-primary'
  }`

export default function SignInPage() {
  const user = useSessionStore((s) => s.user)
  const navigate = useNavigate()
  const locationState = useLocation().state as { from?: string; passwordReset?: boolean } | null
  const from = locationState?.from ?? '/dashboard'
  // Set by the reset-password screen; the success message is not designed yet (Figma).
  const passwordReset = locationState?.passwordReset === true
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Red borders only when the credentials were the problem.
  const [credentialsRejected, setCredentialsRejected] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' } })

  if (user) return <Navigate to={from} replace />

  const clearError = () => {
    setSubmitError(null)
    setCredentialsRejected(false)
  }

  const submit = handleSubmit(async (values) => {
    clearError()
    try {
      await signIn(values)
      navigate(from, { replace: true })
    } catch (error) {
      setSubmitError(errorMessage(error))
      setCredentialsRejected(error instanceof AuthError && error.kind === 'invalid_credentials')
    }
  })

  const email = register('email', { onChange: clearError })
  const password = register('password', { onChange: clearError })

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-0.5 text-sm text-ink-3">Sign in to your TRIGON account</p>

      <form onSubmit={submit} noValidate className="mt-5">
        {passwordReset && !submitError && (
          <div role="status" className="mb-5 rounded-lg border border-primary/30 bg-primary-subtle px-4 py-3 text-sm font-medium text-primary">
            Password updated. Sign in with your new password.
          </div>
        )}
        {submitError && (
          <div role="alert" className="mb-5 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm font-medium text-error-text">
            {submitError}
          </div>
        )}

        <label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-ink">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="name@company.com"
          aria-invalid={!!errors.email || credentialsRejected}
          className={fieldClass(!!errors.email || credentialsRejected)}
          {...email}
        />
        {errors.email && <p className="mt-1 text-xs text-input-error">{errors.email.message}</p>}

        <label htmlFor="password" className="mb-1.5 mt-4 block text-[12px] font-medium text-ink">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={!!errors.password || credentialsRejected}
            className={`${fieldClass(!!errors.password || credentialsRejected)} pr-16`}
            {...password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-3 text-sm font-medium text-ink-3 hover:text-ink"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-input-error">{errors.password.message}</p>}

        <div className="mt-3 text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-medium text-on-primary transition hover:bg-primary-hover disabled:opacity-70"
        >
          {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
