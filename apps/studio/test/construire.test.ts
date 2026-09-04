import { describe, expect, it } from 'vitest'
import { construireArtefact, EntreeIncomplete } from '@/publication/construire.js'
import type { LigneEntree, LigneTheme } from '@/db/schema.js'

const theme: LigneTheme = {
  id: 'les-animaux', nom: 'Les animaux', picto: 'openmoji:1F408', couleur: '#3d7ec9', ordre: 0,
}

function ligne(reste: Partial<LigneEntree> = {}): LigneEntree {
  return {
    id: 'amchich', type: 'mot', kabyle: 'amchich', kabyleStd: null, fr: 'le chat',
    audio: 'audio/amchich.webm', variante: 'kabyle-nord', picto: 'openmoji:1F408',
    themes: ['les-animaux'], niveau: 1, pluriel: null, contient: [], notes: '',
    aValider: true, ordre: 0, creeLe: new Date('2026-09-01T18:00:00.000Z'), ...reste,
  }
}

const options = {
  version: 3,
  publieLe: new Date('2026-09-01T18:00:00.000Z'),
  urlBaseMedias: 'https://medias.awal.app/',
}

describe('construireArtefact', () => {
  it('produit un artefact conforme', () => {
    const artefact = construireArtefact([ligne()], [theme], options)
    expect(artefact.version).toBe(3)
    expect(artefact.publieLe).toBe('2026-09-01T18:00:00.000Z')
    expect(artefact.urlBaseMedias).toBe('https://medias.awal.app/')
    expect(artefact.entrees).toHaveLength(1)
  })

  it('convertit les null de la base en champs absents', () => {
    const artefact = construireArtefact([ligne()], [theme], options)
    expect(artefact.entrees[0]).not.toHaveProperty('kabyleStd')
    expect(artefact.entrees[0]).not.toHaveProperty('pluriel')
  })

  it('conserve les champs optionnels renseignés', () => {
    const artefact = construireArtefact(
      [ligne({ kabyleStd: 'amcic', pluriel: 'imcac' })], [theme], options,
    )
    expect(artefact.entrees[0]?.kabyleStd).toBe('amcic')
    expect(artefact.entrees[0]?.pluriel).toBe('imcac')
  })

  it('n’expose pas les colonnes internes', () => {
    const artefact = construireArtefact([ligne()], [theme], options)
    expect(artefact.entrees[0]).not.toHaveProperty('aValider')
    expect(artefact.entrees[0]).not.toHaveProperty('creeLe')
  })

  it('refuse une entrée sans audio en nommant le coupable', () => {
    expect(() => construireArtefact([ligne({ audio: null })], [theme], options))
      .toThrow(EntreeIncomplete)
    try {
      construireArtefact([ligne({ id: 'muet', audio: null })], [theme], options)
    } catch (erreur) {
      expect((erreur as EntreeIncomplete).entreeId).toBe('muet')
    }
  })

  it('trie les thèmes par ordre', () => {
    const second: LigneTheme = { ...theme, id: 'manger', nom: 'Manger', ordre: -1 }
    const artefact = construireArtefact(
      [ligne({ themes: ['les-animaux'] })], [theme, second], options,
    )
    expect(artefact.themes.map((t) => t.id)).toEqual(['manger', 'les-animaux'])
  })
})
