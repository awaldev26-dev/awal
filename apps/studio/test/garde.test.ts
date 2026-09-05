import { beforeAll, describe, expect, it } from 'vitest'
import { creerSession } from '@/auth/session'
import { sessionValide } from '@/auth/garde'

beforeAll(() => {
  process.env.SESSION_SECRET = 'secret-de-test-suffisamment-long-pour-hs256'
})

describe('sessionValide', () => {
  it('accepte un jeton émis par le studio', async () => {
    expect(await sessionValide(await creerSession())).toBe(true)
  })

  it('refuse un cookie absent', async () => {
    expect(await sessionValide(undefined)).toBe(false)
  })

  it('refuse un jeton bricolé', async () => {
    expect(await sessionValide('pas.un.jwt')).toBe(false)
  })
})
