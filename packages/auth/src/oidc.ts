import { authorizationCodeGrantRequest, discovery } from 'openid-client'

export interface OidcConfig {
  issuerUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface OidcUser {
  sub: string
  email: string
  name?: string
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
  const result = await authorizationCodeGrantRequest(
    cfg,
    oidcConfig.clientId,
    oidcConfig.clientSecret,
    new URL(oidcConfig.redirectUri),
    code,
    codeVerifier,
  )
  const claims = result.claims()
  return {
    sub: claims.sub,
    email: claims.email as string,
    name: claims.name as string | undefined,
  }
}
