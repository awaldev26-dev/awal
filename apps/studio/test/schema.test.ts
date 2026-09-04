import { describe, expect, it } from 'vitest'
import { entrees, themes, publications } from '@/db/schema'

describe('schéma de base', () => {
  it('déclare les colonnes d’une entrée', () => {
    const colonnes = Object.keys(entrees)
    for (const attendue of [
      'id', 'type', 'kabyle', 'kabyleStd', 'fr', 'audio', 'variante',
      'picto', 'themes', 'niveau', 'pluriel', 'contient', 'notes', 'aValider',
    ]) {
      expect(colonnes).toContain(attendue)
    }
  })

  it('déclare les colonnes d’un thème', () => {
    expect(Object.keys(themes)).toEqual(
      expect.arrayContaining(['id', 'nom', 'picto', 'couleur', 'ordre']),
    )
  })

  it('déclare les colonnes d’une publication', () => {
    expect(Object.keys(publications)).toEqual(
      expect.arrayContaining(['version', 'publieLe', 'nbEntrees']),
    )
  })
})
