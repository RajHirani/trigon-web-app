import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address').pipe(z.email('Enter a valid email address')),
})

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
