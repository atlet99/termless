import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  totpCode: z.string().length(6).optional(),
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string().nullable(),
    role: z.enum(['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER']),
  }),
})

export const oidcCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type OidcCallbackInput = z.infer<typeof oidcCallbackSchema>
