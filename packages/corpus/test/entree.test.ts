import { describe, expect, it } from 'vitest'
import { schemaEntree } from '../src/entree'

const entreeValide = {
  id: 'aghroum',
  type: 'mot' as const,
  kabyle: 'aghroum',
  fr: 'le pain',
  audio: 'audio/aghroum.opus',
  variante: 'kabyle-nord',
  picto: 'openmoji:1F35E',
  themes: ['manger-et-boire'],
}

describe('schemaEntree', () => {
  it('accepte une entrée minimale et applique les valeurs par défaut', () => {
    const entree = schemaEntree.parse(entreeValide)
    expect(entree.niveau).toBe(1)
    expect(entree.contient).toEqual([])
    expect(entree.notes).toBe('')
    expect(entree.kabyleStd).toBeUndefined()
  })

  it('accepte les champs optionnels quand ils sont fournis', () => {
    const entree = schemaEntree.parse({
      ...entreeValide,
      kabyleStd: 'aɣrum',
      pluriel: 'ighroumen',
      niveau: 2,
      notes: 'thème du village',
    })
    expect(entree.kabyleStd).toBe('aɣrum')
    expect(entree.pluriel).toBe('ighroumen')
    expect(entree.niveau).toBe(2)
  })

  it('refuse la graphie standard dans le champ kabyle', () => {
    const resultat = schemaEntree.safeParse({ ...entreeValide, kabyle: 'aɣrum' })
    expect(resultat.success).toBe(false)
  })

  it('refuse un id qui n’est pas un slug', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, id: 'Aghroum' }).success).toBe(false)
    expect(schemaEntree.safeParse({ ...entreeValide, id: 'agh roum' }).success).toBe(false)
  })

  it('refuse une entrée sans thème', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, themes: [] }).success).toBe(false)
  })

  it('refuse une traduction vide', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, fr: '' }).success).toBe(false)
  })

  it('refuse un audio manquant', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, audio: '' }).success).toBe(false)
  })

  it('refuse un niveau hors de 1 à 3', () => {
    expect(schemaEntree.safeParse({ ...entreeValide, niveau: 0 }).success).toBe(false)
    expect(schemaEntree.safeParse({ ...entreeValide, niveau: 4 }).success).toBe(false)
  })
})
