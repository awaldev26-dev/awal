import { describe, expect, it } from 'vitest'
import { VERSION_CONTRAT } from '@awal/corpus'

describe('studio', () => {
  it('consomme le paquet corpus', () => {
    expect(VERSION_CONTRAT).toBe(1)
  })
})
