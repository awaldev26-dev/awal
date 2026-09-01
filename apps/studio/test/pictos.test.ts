import { describe, expect, it } from 'vitest'
import { pictoValide, emojiDepuisPicto } from '@/stockage/pictos.js'

describe('pictoValide', () => {
  it('accepte un codepoint simple', () => {
    expect(pictoValide('openmoji:1F35E')).toBe(true)
  })

  it('accepte une séquence de codepoints', () => {
    expect(pictoValide('openmoji:1F468-1F3FE')).toBe(true)
  })

  it('refuse une référence sans préfixe', () => {
    expect(pictoValide('1F35E')).toBe(false)
  })

  it('refuse un codepoint qui n’est pas hexadécimal', () => {
    expect(pictoValide('openmoji:ZZZZ')).toBe(false)
  })

  it('refuse un codepoint hors du plan Unicode', () => {
    expect(pictoValide('openmoji:20000000')).toBe(false)
  })
})

describe('emojiDepuisPicto', () => {
  it('rend le caractère correspondant', () => {
    expect(emojiDepuisPicto('openmoji:1F35E')).toBe('🍞')
  })

  it('rend une séquence complète', () => {
    expect(emojiDepuisPicto('openmoji:1F441-1F5E8')).toBe('👁🗨')
  })

  it('rend une chaîne vide sur référence invalide', () => {
    expect(emojiDepuisPicto('nimportequoi')).toBe('')
  })
})
