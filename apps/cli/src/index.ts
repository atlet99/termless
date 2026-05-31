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

/* eslint-disable @typescript-eslint/naming-convention, unicorn/import-style */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CONFIG_DIR = join(homedir(), '.termless')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

interface Config {
  apiUrl?: string
  token?: string
}

function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as Config
  } catch {
    return {}
  }
}

function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

function getApiUrl(): string {
  const config = loadConfig()
  return config.apiUrl ?? process.env.TERMLNESS_API_URL ?? 'http://localhost:3000'
}

function getToken(): string {
  const config = loadConfig()
  return config.token ?? process.env.TERMLNESS_TOKEN ?? ''
}

async function fetchApi<T>(urlPath: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${getApiUrl()}${urlPath}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = body as Record<string, string>
    throw new Error(err.message || err.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function prompt(message: string): Promise<string> {
  const { createInterface } = await import('node:readline/promises')
  const reader = createInterface({ input: process.stdin, output: process.stdout })
  const result = await reader.question(message)
  reader.close()
  return result
}

async function login(): Promise<void> {
  const defaultUrl = 'http://localhost:3000'
  const envUrl = process.env.TERMLNESS_API_URL
  const apiUrl =
    envUrl !== undefined && envUrl !== ''
      ? envUrl
      : (await prompt(`API URL (default: ${defaultUrl}): `)) || defaultUrl

  const email = await prompt('Email: ')
  const password = await prompt('Password: ')

  try {
    const result = await fetchApi<{
      token: string
      user: { id: string; email: string; role: string }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    saveConfig({ apiUrl, token: result.token })
    console.log(`Logged in as ${result.user.email} (${result.user.role})`)
  } catch {
    console.error('Login failed: invalid response')
    process.exit(1)
  }
}

async function sessionsList(): Promise<void> {
  const sessions =
    await fetchApi<Array<{ id: string; tool: string; name: string | null }>>('/api/v1/sessions')
  console.table(sessions)
}

async function sessionsCreate(): Promise<void> {
  const tool = (await prompt('Tool (opencode/claude/bash): ')) || 'bash'
  const name = await prompt('Session name (optional): ')

  try {
    const session = await fetchApi<{ id: string; wsUrl: string }>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ tool, name: name || undefined }),
    })
    console.log(`Session created: ${session.id}`)
    console.log(`WebSocket URL: ${session.wsUrl}`)
  } catch {
    console.error('Create failed')
  }
}

async function sessionsExec(): Promise<void> {
  const sessionId = process.argv[3]
  const command = process.argv.slice(4).join(' ')
  if (!sessionId || !command) {
    console.error('Usage: termless sessions exec <sessionId> <command>')
    process.exit(1)
  }
  try {
    await fetchApi(`/api/v1/sessions/${sessionId}/exec`, {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
    console.log('Command sent.')
  } catch {
    console.error('Exec failed')
  }
}

async function workspacesList(): Promise<void> {
  const workspaces =
    await fetchApi<Array<{ id: string; name: string; path: string }>>('/api/v1/workspaces')
  console.table(workspaces)
}

async function workspacesClone(): Promise<void> {
  const url = await prompt('Git URL: ')
  const name = await prompt('Workspace name (optional): ')

  try {
    const workspace = await fetchApi<{ id: string; name: string }>('/api/v1/workspaces/clone', {
      method: 'POST',
      body: JSON.stringify({ url, name: name || undefined }),
    })
    console.log(`Workspace cloned: ${workspace.name}`)
  } catch {
    console.error('Clone failed')
  }
}

async function snippetsList(): Promise<void> {
  const snippets =
    await fetchApi<Array<{ id: string; name: string; command: string }>>('/api/v1/snippets')
  console.table(snippets)
}

async function snippetsRun(): Promise<void> {
  const snippetId = process.argv[3]
  if (!snippetId) {
    console.error('Usage: termless snippets run <snippetId>')
    process.exit(1)
  }
  try {
    const snippet = await fetchApi<{ id: string; name: string; command: string }>(
      `/api/v1/snippets/${snippetId}`,
    )
    console.log(`Running snippet: ${snippet.name}`)
    console.log(`Command: ${snippet.command}`)
  } catch {
    console.error('Snippet not found')
  }
}

function printUsage(): void {
  console.log(`Termless CLI

Usage:
  termless login                    — configure API URL + token
  termless sessions list             — list terminal sessions
  termless sessions create           — create new session
  termless sessions exec <id> <cmd>    — execute command in session
  termless workspaces list           — list workspaces
  termless workspaces clone            — clone git repository
  termless snippets list             — list command snippets
  termless snippets run <id>          — run snippet
`)
}

async function main(): Promise<void> {
  const [, , command, subcmd] = process.argv

  if (!command || command === '--help' || command === '-h') {
    printUsage()
    return
  }

  switch (command) {
    case 'login': {
      await login()
      break
    }
    case 'sessions': {
      switch (subcmd) {
        case 'list': {
          await sessionsList()
          break
        }
        case 'create': {
          await sessionsCreate()
          break
        }
        case 'exec': {
          sessionsExec()
          break
        }
        default: {
          console.error(`Unknown sessions subcommand: ${subcmd}`)
          process.exit(1)
        }
      }
      break
    }
    case 'workspaces': {
      switch (subcmd) {
        case 'list': {
          await workspacesList()
          break
        }
        case 'clone': {
          await workspacesClone()
          break
        }
        default: {
          console.error(`Unknown workspaces subcommand: ${subcmd}`)
          process.exit(1)
        }
      }
      break
    }
    case 'snippets': {
      switch (subcmd) {
        case 'list': {
          await snippetsList()
          break
        }
        case 'run': {
          snippetsRun()
          break
        }
        default: {
          console.error(`Unknown snippets subcommand: ${subcmd}`)
          process.exit(1)
        }
      }
      break
    }
    default: {
      console.error(`Unknown command: ${command}`)
      printUsage()
      process.exit(1)
    }
  }
}

main().catch(() => {
  process.exit(1)
})
