import { z } from 'zod'

export const toolSchema = z.enum(['OPENCODE', 'CLAUDE', 'BASH'])

export const createSessionSchema = z.object({
  tool: toolSchema,
  workspaceId: z.string().optional(),
})

export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tool: toolSchema,
  tmuxSession: z.string(),
  ttydPort: z.number().nullable(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string(),
})

export const sessionListSchema = z.array(sessionSchema)

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type Session = z.infer<typeof sessionSchema>
