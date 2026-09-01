import { describe, expect, it } from 'vitest'
import { schemaTheme } from '../src/theme.js'
import { schemaArtefact } from '../src/artefact.js'

const theme = {
  id: 'manger-et-boire',
  nom: 'Manger et boire',
  picto: 'openmoji:1F35E',
  couleur: '#c94f3d',
}

const entree = {
  id: 'aghroum',
  type: 'mot' as const,
  kabyle: 'aghroum',
  fr: 'le pain',
  audio: 'audio/aghroum.opus',
  variante: 'kabyle-nord',
  picto: 'openmoji:1F35E',
  themes: ['manger-et-boire'],
}

const artefact = {
  version: 1,
  publieLe: '2026-09-01T18:00:00.000Z',
  urlBaseAudio: 'https://media.awal.app/',
  themes: [theme],
  entrees: [entree],
}

describe('schemaTheme', () => {
  it('accepte un thème valide', () => {
    expect(schemaTheme.parse(theme).nom).toBe('Manger et boire')
  })

  it('refuse une couleur qui n’est pas hexadécimale', () => {
    expect(schemaTheme.safeParse({ ...theme, couleur: 'rouge' }).success).toBe(false)
  })
})

describe('schemaArtefact', () => {
  it('accepte un artefact valide', () => {
    expect(schemaArtefact.parse(artefact).entrees).toHaveLength(1)
  })

  it('refuse un artefact sans entrée', () => {
    expect(schemaArtefact.safeParse({ ...artefact, entrees: [] }).success).toBe(false)
  })

  it('refuse une version nulle ou négative', () => {
    expect(schemaArtefact.safeParse({ ...artefact, version: 0 }).success).toBe(false)
  })

  it('refuse une date de publication mal formée', () => {
    expect(schemaArtefact.safeParse({ ...artefact, publieLe: '01/09/2026' }).success).toBe(false)
  })

  it('accepte un chemin absolu comme base audio', () => {
    expect(schemaArtefact.safeParse({ ...artefact, urlBaseAudio: '/' }).success).toBe(true)
    expect(schemaArtefact.safeParse({ ...artefact, urlBaseAudio: '/medias/' }).success).toBe(true)
  })

  it('refuse une url de base invalide', () => {
    expect(schemaArtefact.safeParse({ ...artefact, urlBaseAudio: 'media.awal.app' }).success).toBe(false)
    expect(schemaArtefact.safeParse({ ...artefact, urlBaseAudio: 'ftp://x/' }).success).toBe(false)
  })
})
