import { describe, expect, it } from 'vitest'
import { resetPasswordSchema } from './resetPasswordSchema'

const parse = (password: string, confirmPassword = password) => resetPasswordSchema.safeParse({ password, confirmPassword })

describe('resetPasswordSchema', () => {
  it('accepts 8+ characters with a number and a symbol', () => {
    expect(parse('Trigon@123').success).toBe(true)
  })

  it('rejects short, number-less and symbol-less passwords', () => {
    expect(parse('Ab1@').success).toBe(false)
    expect(parse('Trigon@abc').success).toBe(false)
    expect(parse('Trigon1234').success).toBe(false)
  })

  it('rejects a mismatched confirmation on the confirm field', () => {
    const result = parse('Trigon@123', 'Trigon@124')
    expect(result.success).toBe(false)
    expect(!result.success && result.error.issues[0].path).toEqual(['confirmPassword'])
  })
})
