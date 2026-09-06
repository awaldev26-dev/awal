import { describe, expect, it } from 'vitest'
import type { Artefact, Entree } from '@awal/corpus'
import { grouperParTheme } from '@/interface/ListeThemes'

function entree(id: string, themes: string[]): Entree {
  return {
    id,
    type: 'mot',
    kabyle: id,
    fr: id,
    audio: `audio/${id}.webm`,
    variante: 'kabyle-nord',
    picto: 'openmoji:1F35E',
    themes,
    niveau: 1,
    contient: [],
    notes: '',
  }
}

function artefact(entrees: Entree[], themes: string[]): Artefact {
  return {
    version: 1,
    publieLe: '2026-09-06T00:00:00.000Z',
    urlBaseMedias: '/',
    themes: themes.map((id) => ({
      id,
      nom: id,
      picto: 'openmoji:1F35E',
      couleur: '#000000',
    })),
    entrees,
  }
}

describe('grouperParTheme', () => {
  it('range chaque entrée sous son thème', () => {
    const table = grouperParTheme(
      artefact([entree('a', ['maison']), entree('b', ['corps'])], ['maison', 'corps']),
    )
    expect(table.get('maison')?.map((e) => e.id)).toEqual(['a'])
    expect(table.get('corps')?.map((e) => e.id)).toEqual(['b'])
  })

  it('fait apparaître une entrée dans chacun de ses thèmes', () => {
    // Un mot peut légitimement relever de deux thèmes : l'imagier comme l'Écho
    // doivent le proposer dans les deux.
    const table = grouperParTheme(
      artefact([entree('aman', ['maison', 'manger'])], ['maison', 'manger']),
    )
    expect(table.get('maison')?.map((e) => e.id)).toEqual(['aman'])
    expect(table.get('manger')?.map((e) => e.id)).toEqual(['aman'])
  })

  it('donne un tableau vide à un thème sans entrée, jamais undefined', () => {
    // Les deux écrans masquent les thèmes vides en lisant cette longueur :
    // un undefined les ferait tomber.
    const table = grouperParTheme(artefact([], ['vide']))
    expect(table.get('vide')).toEqual([])
  })

  it('ignore un thème inconnu porté par une entrée', () => {
    const table = grouperParTheme(artefact([entree('a', ['fantome'])], ['maison']))
    expect(table.has('fantome')).toBe(false)
    expect(table.get('maison')).toEqual([])
  })
})
