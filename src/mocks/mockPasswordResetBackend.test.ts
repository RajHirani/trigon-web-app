import { describe, expect, it } from 'vitest'
import { AuthError } from '@/services/auth/authError'
import { FAILING_EMAIL, mockPasswordResetBackend } from './mockPasswordResetBackend'

describe('mockPasswordResetBackend', () => {
  it('resolves for known and unknown emails alike', async () => {
    await expect(mockPasswordResetBackend.requestReset('admin@trigon.test')).resolves.toBeUndefined()
    await expect(mockPasswordResetBackend.requestReset('nobody@example.com')).resolves.toBeUndefined()
  })

  it('rejects for the failing email', async () => {
    await expect(mockPasswordResetBackend.requestReset(FAILING_EMAIL)).rejects.toBeInstanceOf(AuthError)
  })
})
