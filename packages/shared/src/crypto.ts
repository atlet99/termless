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

import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

const getSecretKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY
  if (key?.length === 64) {
    return Buffer.from(key, 'hex')
  }
  console.warn(
    'WARNING: Using ephemeral encryption key. Set ENCRYPTION_KEY env var (64 hex chars).',
  )
  return crypto.randomBytes(32)
}

const SECRET_KEY = getSecretKey()

export function encryptEnvVariable(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('hex')
}

export function decryptEnvVariable(encrypted: string): string {
  const buffer = Buffer.from(encrypted, 'hex')
  const iv = buffer.subarray(0, IV_LENGTH)
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encryptedData = buffer.subarray(IV_LENGTH + TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8')
}

export function maskValue(value: string): string {
  if (value.length <= 4) return '****'
  return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
}
