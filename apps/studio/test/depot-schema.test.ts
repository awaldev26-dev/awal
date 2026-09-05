import { describe, expect, it } from 'vitest'
import { schemaDepot, schemaEntreeSource, schemaThemeSource } from '@/depot/types'

const minimale = {
  id: 'aghroum',
  type: 'mot',
  kabyle: 'aghroum',
  fr: 'le pain',
  picto: 'openmoji:1F35E',
}

describe('schemaEntreeSource', () => {
  it('accepte une entrée minimale et complète le reste', () => {
    const entree = schemaEntreeSource.parse(minimale)
    expect(entree.audio).toBeNull()
    expect(entree.aValider).toBe(true)
    expect(entree.niveau).toBe(1)
    expect(entree.variante).toBe('kabyle-nord')
    expect(entree.contient).toEqual([])
  })

  it('accepte une entrée sans audio', () => {
    // L'entrée existe avant d'être enregistrée : c'est tout l'intérêt du studio.
    expect(schemaEntreeSource.safeParse({ ...minimale, audio: null }).success).toBe(true)
  })

  it('refuse un picto mal formé', () => {
    expect(schemaEntreeSource.safeParse({ ...minimale, picto: 'cassé' }).success).toBe(false)
  })

  it('accepte un picto image', () => {
    const entree = schemaEntreeSource.parse({ ...minimale, picto: 'image:pictos/x.webp' })
    expect(entree.picto).toBe('image:pictos/x.webp')
  })

  it('refuse un identifiant qui n’est pas un slug', () => {
    expect(schemaEntreeSource.safeParse({ ...minimale, id: 'Aghroum' }).success).toBe(false)
  })

  it('refuse un niveau hors de 1 à 3', () => {
    expect(schemaEntreeSource.safeParse({ ...minimale, niveau: 4 }).success).toBe(false)
  })
})

describe('schemaThemeSource', () => {
  it('accepte un thème valide', () => {
    const theme = schemaThemeSource.parse({
      id: 'les-animaux',
      nom: 'Les animaux',
      picto: 'openmoji:1F43E',
      couleur: '#3d7ec9',
    })
    expect(theme.ordre).toBe(0)
  })

  it('refuse une couleur qui n’est pas hexadécimale', () => {
    expect(
      schemaThemeSource.safeParse({
        id: 'x',
        nom: 'X',
        picto: 'openmoji:1F43E',
        couleur: 'bleu',
      }).success,
    ).toBe(false)
  })
})

describe('schemaDepot', () => {
  it('accepte un dépôt vide', () => {
    const depot = schemaDepot.parse({})
    expect(depot).toEqual({ format: 1, themes: [], entrees: [], publications: [] })
  })

  it('refuse un format inconnu', () => {
    // Un format futur doit provoquer une erreur claire plutôt qu'une lecture
    // silencieusement fausse.
    expect(schemaDepot.safeParse({ format: 2 }).success).toBe(false)
  })

  it('conserve l’historique des publications', () => {
    const depot = schemaDepot.parse({
      publications: [{ version: 3, publieLe: '2026-09-06T10:00:00.000Z', nbEntrees: 240 }],
    })
    expect(depot.publications[0]?.version).toBe(3)
  })
})
