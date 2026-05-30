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

import type { RedisClientType } from 'redis'
import type { AuthenticatedUser } from '@termless/shared'
import { createClient } from 'redis'

let redisClient: RedisClientType | null = null

/**
 * Get or create a Redis client connection.
 * Reuses existing connection if available.
 * Reconnects automatically on error.
 *
 * @param redisUrl - Redis connection URL
 * @returns Connected Redis client
 */
export async function getRedisClient(redisUrl: string): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({ url: redisUrl })
    redisClient.on('error', (err) => {
      console.error('Redis error:', err)
      // Reset client so next call creates a new connection
      redisClient = null
    })
    await redisClient.connect()
  }
  return redisClient
}

/**
 * Create a new authenticated session in Redis.
 *
 * @param redisUrl - Redis connection URL
 * @param user - Authenticated user data to store
 * @param ttlSeconds - Session time-to-live in seconds
 * @returns Session token string
 */
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

/**
 * Retrieve an authenticated session from Redis.
 * Optionally extends the session TTL on access.
 *
 * @param redisUrl - Redis connection URL
 * @param token - Session token to look up
 * @param ttlSeconds - Optional TTL to extend session on access
 * @returns Authenticated user data or null if session expired/missing
 */
export async function getSession(
  redisUrl: string,
  token: string,
  ttlSeconds?: number,
): Promise<AuthenticatedUser | null> {
  const client = await getRedisClient(redisUrl)
  const key = `termless:session:${token}`
  const data = await client.get(key)
  if (!data) return null

  if (ttlSeconds) {
    await client.expire(key, ttlSeconds)
  }

  return JSON.parse(data) as AuthenticatedUser
}

/**
 * Destroy an authenticated session in Redis.
 *
 * @param redisUrl - Redis connection URL
 * @param token - Session token to destroy
 */
export async function destroySession(redisUrl: string, token: string): Promise<void> {
  const client = await getRedisClient(redisUrl)
  await client.del(`termless:session:${token}`)
}
