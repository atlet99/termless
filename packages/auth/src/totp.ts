import { Secret, TOTP } from 'otpauth'

export function generateTotpSecret(email: string): { secret: string; uri: string } {
  const secret = new Secret({ size: 20 })
  const totp = new TOTP({
    issuer: 'Termless',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })
  return {
    secret: secret.base32,
    uri: totp.toString(),
  }
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new TOTP({
    issuer: 'Termless',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  })
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}
