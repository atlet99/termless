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
import { ROLE_NAMES } from '../roles.js'

export const roleSchema = z.enum(ROLE_NAMES)

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

export type User = z.infer<typeof userSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
