/**
 * Copyright 2026 Abdurakhman Rakhmankulov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod'

export const toolSchema = z.enum(['OPENCODE', 'CLAUDE', 'BASH'])

export const createSessionSchema = z.object({
  tool: toolSchema,
  name: z.string().max(100).optional(),
  workspaceId: z.string().optional(),
  notes: z.string().max(200).optional(),
  templateId: z.string().optional(),
})

export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  notes: z.string().nullable(),
  tool: toolSchema,
  tmuxSession: z.string(),
  ttydPort: z.number().nullable(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string(),
})

export const sessionListSchema = z.array(sessionSchema)

export const recordingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  title: z.string().nullable(),
  filePath: z.string(),
  duration: z.number().nullable(),
  sizeBytes: z.number(),
  createdAt: z.string(),
})

export const createPlaybackShareSchema = z.object({
  recordingId: z.string(),
  expiresIn: z.enum(['1h', '24h', '7d']),
})

export const execCommandSchema = z.object({
  command: z.string().min(1).max(10_000),
})

export const patchSessionSchema = z.object({
  name: z.string().max(100).optional(),
  notes: z.string().max(200).optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type Session = z.infer<typeof sessionSchema>
export type Recording = z.infer<typeof recordingSchema>
export type CreatePlaybackShareInput = z.infer<typeof createPlaybackShareSchema>
export type ExecCommandInput = z.infer<typeof execCommandSchema>
export type PatchSessionInput = z.infer<typeof patchSessionSchema>
