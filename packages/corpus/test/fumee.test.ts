import { describe, expect, it } from 'vitest'
import { VERSION_CONTRAT } from '../src/index.js'

describe('paquet corpus', () => {
  it('expose la version du contrat', () => {
    expect(VERSION_CONTRAT).toBe(1)
  })
})
