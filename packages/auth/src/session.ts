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
