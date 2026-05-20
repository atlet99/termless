import type { AuthenticatedUser } from '@termless/shared'
import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient(redisUrl: string) {
  if (!redisClient) {
    redisClient = createClient({ url: redisUrl })
    redisClient.on('error', (err) => console.error('Redis error:', err))
    await redisClient.connect()
  }
  return redisClient
}

export async function createSession(
  redisUrl: string,
  user: AuthenticatedUser,
  ttlSeconds: number,
): Promise<string> {
  const client = await getRedisClient(redisUrl)
  const token = crypto.randomUUID()
  const key = `termless:session:${token}`
  await client.set(key, JSON.stringify({ ...user }), { EX: ttlSeconds })
  return token
}

export async function getSession(
  redisUrl: string,
  token: string,
): Promise<AuthenticatedUser | null> {
  const client = await getRedisClient(redisUrl)
  const data = await client.get(`termless:session:${token}`)
  if (!data) return null
  return JSON.parse(data) as AuthenticatedUser
}

export async function destroySession(redisUrl: string, token: string): Promise<void> {
  const client = await getRedisClient(redisUrl)
  await client.del(`termless:session:${token}`)
}
