import { describe, expect, it } from 'vitest'
import { ALPHABET } from '@/alphabet'

describe('ALPHABET', () => {
  it('contient les 26 lettres', () => {
    expect(ALPHABET).toHaveLength(26)
  })

  it('les donne dans l’ordre de A à Z', () => {
    const attendu = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
    expect(ALPHABET.map((l) => l.glyphe)).toEqual(attendu)
  })

  it('n’a aucun glyphe en double', () => {
    expect(new Set(ALPHABET.map((l) => l.glyphe)).size).toBe(26)
  })

  it('donne une prononciation non vide à chaque lettre', () => {
    for (const lettre of ALPHABET) {
      expect(lettre.dit.trim().length).toBeGreaterThan(0)
    }
  })

  it('ne donne jamais le glyphe brut à la synthèse', () => {
    // Le glyphe seul se prononce mal : « Y » devient « y » au lieu de
    // « i grec ». Une entrée dont `dit` est la majuscule est un oubli.
    for (const lettre of ALPHABET) {
      expect(lettre.dit).not.toBe(lettre.glyphe)
    }
  })

  it('écrit les prononciations en minuscules', () => {
    // Une majuscule dans `dit` ferait épeler la lettre par certains moteurs.
    for (const lettre of ALPHABET) {
      expect(lettre.dit).toBe(lettre.dit.toLowerCase())
    }
  })
})
