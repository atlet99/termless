import { describe, expect, it } from 'vitest'

import { createSessionSchema } from '../src/schemas/session.js'
import { updateUserRoleSchema, roleSchema } from '../src/schemas/user.js'
import { createWorkspaceSchema } from '../src/schemas/workspace.js'

describe('createSessionSchema', () => {
  it('should accept valid OPENCODE tool', () => {
    const result = createSessionSchema.safeParse({ tool: 'OPENCODE' })
    expect(result.success).toBe(true)
  })

  it('should accept valid CLAUDE tool', () => {
    const result = createSessionSchema.safeParse({ tool: 'CLAUDE' })
    expect(result.success).toBe(true)
  })

  it('should accept valid BASH tool', () => {
    const result = createSessionSchema.safeParse({ tool: 'BASH' })
    expect(result.success).toBe(true)
  })

  it('should accept tool with optional workspaceId', () => {
    const result = createSessionSchema.safeParse({
      tool: 'OPENCODE',
      workspaceId: 'ws-123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid tool', () => {
    const result = createSessionSchema.safeParse({ tool: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should reject missing tool', () => {
    const result = createSessionSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('roleSchema', () => {
  it('should accept ADMIN', () => {
    expect(roleSchema.safeParse('ADMIN').success).toBe(true)
  })

  it('should accept OPERATOR', () => {
    expect(roleSchema.safeParse('OPERATOR').success).toBe(true)
  })

  it('should accept DEVELOPER', () => {
    expect(roleSchema.safeParse('DEVELOPER').success).toBe(true)
  })

  it('should accept VIEWER', () => {
    expect(roleSchema.safeParse('VIEWER').success).toBe(true)
  })

  it('should reject invalid role', () => {
    expect(roleSchema.safeParse('SUPERADMIN').success).toBe(false)
  })
})

describe('updateUserRoleSchema', () => {
  it('should accept valid role update', () => {
    const result = updateUserRoleSchema.safeParse({ role: 'ADMIN' })
    expect(result.success).toBe(true)
  })

  it('should reject missing role', () => {
    const result = updateUserRoleSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('createWorkspaceSchema', () => {
  it('should accept valid workspace', () => {
    const result = createWorkspaceSchema.safeParse({
      name: 'My Workspace',
      path: '/workspace/my-project',
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing name', () => {
    const result = createWorkspaceSchema.safeParse({ path: '/workspace/test' })
    expect(result.success).toBe(false)
  })

  it('should reject missing path', () => {
    const result = createWorkspaceSchema.safeParse({ name: 'Test' })
    expect(result.success).toBe(false)
  })
})
