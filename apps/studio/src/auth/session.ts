import { SignJWT, jwtVerify } from 'jose'

export const NOM_COOKIE = 'awal_session'

const DUREE = '30d'

function cle(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET manquante.')
  return new TextEncoder().encode(secret)
}

/** Émet un jeton signé. Le studio étant mono-utilisateur, il ne porte aucune identité. */
export async function creerSession(): Promise<string> {
  return new SignJWT({ studio: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DUREE)
    .sign(cle())
}

export async function verifierSession(jeton: string | undefined): Promise<boolean> {
  if (!jeton) return false
  try {
    await jwtVerify(jeton, cle())
    return true
  } catch {
    return false
  }
}
