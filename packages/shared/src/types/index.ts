export type Role = 'ADMIN' | 'OPERATOR' | 'DEVELOPER' | 'VIEWER'

export type Tool = 'OPENCODE' | 'CLAUDE' | 'BASH'

export interface JwtPayload {
  sub: string
  email: string
  role: Role
  iat: number
  exp: number
}

export interface AuthenticatedUser {
  id: string
  email: string
  displayName: string | null
  role: Role
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface PaginationQuery {
  page?: number
  limit?: number
}
