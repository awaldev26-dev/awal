import { beforeAll, describe, expect, it } from 'vitest'
import { creerSession, verifierSession, NOM_COOKIE } from '@/auth/session.js'

beforeAll(() => {
  process.env.SESSION_SECRET = 'secret-de-test-suffisamment-long-pour-hs256'
})

describe('session du studio', () => {
  it('accepte un jeton qu’elle vient d’émettre', async () => {
    expect(await verifierSession(await creerSession())).toBe(true)
  })

  it('refuse un jeton absent', async () => {
    expect(await verifierSession(undefined)).toBe(false)
  })

  it('refuse un jeton bricolé', async () => {
    expect(await verifierSession('pas.un.jwt')).toBe(false)
  })

  it('refuse un jeton signé avec une autre clé', async () => {
    const jeton = await creerSession()
    process.env.SESSION_SECRET = 'une-tout-autre-cle-de-signature-aussi-longue'
    expect(await verifierSession(jeton)).toBe(false)
    process.env.SESSION_SECRET = 'secret-de-test-suffisamment-long-pour-hs256'
  })

  it('expose un nom de cookie stable', () => {
    expect(NOM_COOKIE).toBe('awal_session')
  })
})
