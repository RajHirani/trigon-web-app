import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthError } from '@/services/auth/authError'
import { resetPassword } from '@/services/auth/passwordResetService'
import { useSessionStore } from '@/store/sessionStore'
import { AuthLayout } from './AuthLayout'
import { resetPasswordSchema, type ResetPasswordValues } from './resetPasswordSchema'

// Error copy is not designed yet (Figma); placeholders.
const LINK_EXPIRED = 'This reset link has expired or is no longer valid.'
const REQUEST_ERROR = 'We couldn’t reset your password. Try again.'

const fieldClass = (invalid: boolean) =>
  `block w-full rounded-lg border bg-input px-3 py-2.5 pr-16 text-sm text-ink outline-none placeholder:text-ink-3/70 focus:ring-2 focus:ring-primary/30 ${
    invalid ? 'border-input-error' : 'border-line focus:border-primary'
  }`

function PasswordInput({
  id,
  label,
  placeholder,
  autoFocus,
  error,
  registration,
  className = '',
}: {
  id: string
  label: string
  placeholder: string
  autoFocus?: boolean
  error?: string
  registration: UseFormRegisterReturn
  className?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={fieldClass(!!error)}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-3 text-sm font-medium text-ink-3 hover:text-ink"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-input-error">{error}</p>}
    </div>
  )
}

export default function ResetPasswordPage() {
  const user = useSessionStore((s) => s.user)
  const navigate = useNavigate()
  const token = useSearchParams()[0].get('token') ?? ''
  const [submitError, setSubmitError] = useState<string | null>(token ? null : LINK_EXPIRED)
  const [linkExpired, setLinkExpired] = useState(!token)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  if (user) return <Navigate to="/dashboard" replace />

  const clearError = () => {
    if (!linkExpired) setSubmitError(null)
  }

  const submit = handleSubmit(async ({ password }) => {
    clearError()
    try {
      await resetPassword(token, password)
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch (error) {
      const expired = error instanceof AuthError && error.kind === 'invalid_credentials'
      setLinkExpired(expired)
      setSubmitError(expired ? LINK_EXPIRED : REQUEST_ERROR)
    }
  })

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-ink">Set new password</h1>
      <p className="mt-0.5 text-sm text-ink-3">Choose a strong password for your account.</p>

      <form onSubmit={submit} noValidate className="mt-5">
        {submitError && (
          <div role="alert" className="mb-5 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm font-medium text-error-text">
            {submitError}
            {linkExpired && (
              <>
                {' '}
                <Link to="/forgot-password" className="underline">
                  Request a new link
                </Link>
              </>
            )}
          </div>
        )}

        <PasswordInput
          id="password"
          label="New password"
          placeholder="Minimum 8 characters"
          autoFocus
          error={errors.password?.message}
          registration={register('password', { onChange: clearError })}
        />
        <p className="mt-1.5 text-xs text-ink-3">Use at least 8 characters with a number and a symbol.</p>

        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter password"
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword', { onChange: clearError })}
          className="mt-4"
        />

        <button
          type="submit"
          disabled={isSubmitting || linkExpired}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-medium text-on-primary transition hover:bg-primary-hover disabled:opacity-70"
        >
          {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />}
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  )
}
