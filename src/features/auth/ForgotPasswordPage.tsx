import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { requestPasswordReset } from '@/services/auth/passwordResetService'
import { useSessionStore } from '@/store/sessionStore'
import { AuthLayout } from './AuthLayout'
import { forgotPasswordSchema, type ForgotPasswordValues } from './forgotPasswordSchema'

// Failure copy is not designed yet (Figma); placeholder, same as mobile.
const REQUEST_ERROR = 'We couldn’t send the link. Try again.'

const fieldClass = (invalid: boolean) =>
  `block w-full rounded-lg border bg-input px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-3/70 focus:ring-2 focus:ring-primary/30 ${
    invalid ? 'border-input-error' : 'border-line focus:border-primary'
  }`

const buttonClass =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-medium text-on-primary transition hover:bg-primary-hover disabled:opacity-70'

function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
}

export default function ForgotPasswordPage() {
  const user = useSessionStore((s) => s.user)
  // Email the link was sent to; set once the request succeeds ("Check your email").
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  if (user) return <Navigate to="/dashboard" replace />

  const submit = handleSubmit(async ({ email }) => {
    setSubmitError(null)
    try {
      await requestPasswordReset(email)
      setSentTo(email)
    } catch {
      setSubmitError(REQUEST_ERROR)
    }
  })

  const resend = async () => {
    if (!sentTo || resending) return
    setResending(true)
    setResent(false)
    try {
      await requestPasswordReset(sentTo)
      setResent(true)
    } catch {
      // Resend failure copy / throttling are not designed yet.
    } finally {
      setResending(false)
    }
  }

  const email = register('email', { onChange: () => setSubmitError(null) })

  if (sentTo) {
    return (
      <AuthLayout>
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-subtle text-2xl font-semibold text-primary" aria-hidden>
          @
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-3">We’ve sent a password reset link to</p>
        <p className="mt-0.5 break-all text-sm font-semibold text-ink">{sentTo}</p>
        <p className="mt-5 text-[13px] text-ink-3">
          The link expires in 30 minutes. If you don’t see it, <br className="hidden sm:inline" />
          check your spam folder.
        </p>

        <Link to="/login" className={`${buttonClass} mt-6`}>
          Back to sign in
        </Link>

        <p className="mt-4 text-center text-[13px] text-ink-3" role="status">
          {resent ? 'Link sent again.' : 'Didn’t get the email?'}{' '}
          <button type="button" onClick={resend} disabled={resending} className="font-medium text-primary hover:underline disabled:opacity-60">
            {resending ? 'Sending…' : 'Resend link'}
          </button>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-ink">Forgot password?</h1>
      <p className="mt-0.5 text-sm text-ink-3">Enter your email and we’ll send you a reset link.</p>

      <form onSubmit={submit} noValidate className="mt-5">
        {submitError && (
          <div role="alert" className="mb-5 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm font-medium text-error-text">
            {submitError}
          </div>
        )}

        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="name@company.com"
          aria-invalid={!!errors.email}
          className={fieldClass(!!errors.email)}
          {...email}
        />
        {errors.email && <p className="mt-1 text-xs text-input-error">{errors.email.message}</p>}

        <button type="submit" disabled={isSubmitting} className={`${buttonClass} mt-5`}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link to="/login" className="text-[13px] font-medium text-primary hover:underline">
          ← Back to sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
