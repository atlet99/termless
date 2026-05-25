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

export interface RoleDefinition {
  level: number
  label: string
}

export const ROLES = {
  VIEWER: { level: 0, label: 'Viewer' },
  DEVELOPER: { level: 1, label: 'Developer' },
  OPERATOR: { level: 2, label: 'Operator' },
  ADMIN: { level: 3, label: 'Administrator' },
} as const satisfies Record<string, RoleDefinition>

export type Role = keyof typeof ROLES

export const ROLE_NAMES = Object.keys(ROLES) as Role[]

export function getRoleLevel(role: string): number {
  return (ROLES as Record<string, RoleDefinition>)[role]?.level ?? -1
}

export function isValidRole(role: string): role is Role {
  return role in ROLES
}

export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}
