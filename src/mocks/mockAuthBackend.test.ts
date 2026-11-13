import { describe, expect, it } from 'vitest'
import { MOCK_PASSWORD, mockAuthBackend } from './mockAuthBackend'

describe('mockAuthBackend', () => {
  it('signs in a valid user and resolves /me from the token', async () => {
    const t = await mockAuthBackend.postToken({ grant_type: 'password', username: 'ADMIN@trigon.test', password: MOCK_PASSWORD })
    const { me, roles } = await mockAuthBackend.getMe(t.access_token)
    expect(me.role).toBe('ADMIN')
    expect(roles[0].code).toBe('ADMIN')
  })
  it('rejects a wrong password', async () => {
    await expect(mockAuthBackend.postToken({ grant_type: 'password', username: 'admin@trigon.test', password: 'x' })).rejects.toMatchObject({ kind: 'invalid_credentials' })
  })
  it('rejects a deactivated user', async () => {
    await expect(mockAuthBackend.postToken({ grant_type: 'password', username: 'deactivated@trigon.test', password: MOCK_PASSWORD })).rejects.toMatchObject({ kind: 'deactivated' })
  })
})
