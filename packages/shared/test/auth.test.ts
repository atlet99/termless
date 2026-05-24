import { describe, expect, it } from 'vitest'

import { loginSchema } from '../src/schemas/auth.js'

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'securePassword123',
    })
    expect(result.success).toBe(true)
  })

  it('should accept login with optional TOTP code', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'securePassword123',
      totpCode: '123456',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'securePassword123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('should reject TOTP code with wrong length', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'securePassword123',
      totpCode: '12345',
    })
    expect(result.success).toBe(false)
  })
})
