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

export const totpSetupSchema = z.object({
  totpCode: z.string().length(6),
})

export const totpSetupResponseSchema = z.object({
  secret: z.string(),
  uri: z.string(),
})

export type TotpSetupInput = z.infer<typeof totpSetupSchema>
export type TotpSetupResponse = z.infer<typeof totpSetupResponseSchema>

export const envVariableSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.string(),
})

export const envVariableResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  maskedValue: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type EnvVariableInput = z.infer<typeof envVariableSchema>
export type EnvVariableResponse = z.infer<typeof envVariableResponseSchema>

export const createApiTokenSchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

export const apiTokenResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
})

export const apiTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  lastUsed: z.date().nullable(),
})

export type CreateApiTokenInput = z.infer<typeof createApiTokenSchema>
export type ApiTokenResponse = z.infer<typeof apiTokenResponseSchema>
export type ApiToken = z.infer<typeof apiTokenSchema>
