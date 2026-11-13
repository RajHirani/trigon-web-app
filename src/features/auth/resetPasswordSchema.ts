import { z } from 'zod'

// Rule from the Figma hint: "at least 8 characters with a number and a symbol".
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Enter a new password')
      .min(8, 'Use at least 8 characters')
      .regex(/\d/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one symbol'),
    confirmPassword: z.string().min(1, 'Re-enter your password'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
