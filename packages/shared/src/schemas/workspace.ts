import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string().min(1),
})

export const workspaceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  path: z.string(),
  createdAt: z.string(),
})

export const workspaceListSchema = z.array(workspaceSchema)

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type Workspace = z.infer<typeof workspaceSchema>
