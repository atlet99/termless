import { z } from 'zod'

export const roleSchema = z.enum(['ADMIN', 'OPERATOR', 'DEVELOPER', 'VIEWER'])

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  role: roleSchema,
  createdAt: z.string(),
})

export const updateUserRoleSchema = z.object({
  role: roleSchema,
})

export const userListSchema = z.array(userSchema)

export type Role = z.infer<typeof roleSchema>
export type User = z.infer<typeof userSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
