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

import { authorizationCodeGrant, discovery } from 'openid-client'

export interface OidcConfig {
  issuerUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface OidcUser {
  sub: string
  email: string
  name?: string | undefined
}

let config: Awaited<ReturnType<typeof discovery>> | null = null

export async function getOidcConfig(oidcConfig: OidcConfig) {
  if (!config) {
    config = await discovery(
      new URL(oidcConfig.issuerUrl),
      oidcConfig.clientId,
      oidcConfig.clientSecret,
    )
  }
  return config
}

export function getAuthorizationUrl(
  oidcConfig: OidcConfig,
  state: string,
  codeVerifier: string,
): Promise<string> {
  return getOidcConfig(oidcConfig).then((cfg) => {
    const url = new URL(cfg.serverMetadata().authorization_endpoint ?? '')
    url.searchParams.set('client_id', oidcConfig.clientId)
    url.searchParams.set('redirect_uri', oidcConfig.redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'openid email profile')
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge_method', 'S256')
    url.searchParams.set('code_challenge', codeVerifier)
    return url.toString()
  })
}

export async function handleCallback(
  oidcConfig: OidcConfig,
  code: string,
  codeVerifier: string,
): Promise<OidcUser> {
  const cfg = await getOidcConfig(oidcConfig)
  const result = await (authorizationCodeGrant as any)(cfg, new URL(oidcConfig.redirectUri), {
    client_id: oidcConfig.clientId,
    code,
    code_verifier: codeVerifier,
  })
  const claims = result.claims()
  if (!claims) {
    throw new Error('No claims in OIDC response')
  }
  return {
    sub: claims.sub,
    email: claims.email as string,
    name: typeof claims.name === 'string' ? claims.name : undefined,
  }
}
