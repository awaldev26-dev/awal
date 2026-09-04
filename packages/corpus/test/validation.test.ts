import { describe, expect, it } from 'vitest'
import { schemaArtefact } from '../src/artefact.js'
import { validerStructure } from '../src/validation.js'
import type { Artefact } from '../src/artefact.js'

function construire(entrees: unknown[], themesIds = ['manger-et-boire']): Artefact {
  return schemaArtefact.parse({
    version: 1,
    publieLe: '2026-09-01T18:00:00.000Z',
    urlBaseMedias: 'https://media.awal.app/',
    themes: themesIds.map((id) => ({ id, nom: id, picto: 'openmoji:1F35E', couleur: '#c94f3d' })),
    entrees,
  })
}

const mot = (id: string, reste: Record<string, unknown> = {}) => ({
  id,
  type: 'mot',
  kabyle: id,
  fr: id,
  audio: `audio/${id}.opus`,
  variante: 'kabyle-nord',
  picto: 'openmoji:1F35E',
  themes: ['manger-et-boire'],
  ...reste,
})

describe('validerStructure', () => {
  it('ne signale rien sur un corpus sain', () => {
    expect(validerStructure(construire([mot('aghroum'), mot('aman')]))).toEqual([])
  })

  it('signale un identifiant dupliqué', () => {
    const problemes = validerStructure(construire([mot('aman'), mot('aman')]))
    expect(problemes).toHaveLength(1)
    expect(problemes[0]?.code).toBe('id-duplique')
    expect(problemes[0]?.entreeId).toBe('aman')
  })

  it('signale un thème inconnu', () => {
    const problemes = validerStructure(construire([mot('aman', { themes: ['inexistant'] })]))
    expect(problemes.map((p) => p.code)).toEqual(['theme-inconnu'])
  })

  it('signale une phrase qui référence un mot absent', () => {
    const phrase = mot('etch-aghroum', { type: 'phrase', contient: ['aghroum', 'absent'] })
    const problemes = validerStructure(construire([mot('aghroum'), phrase]))
    expect(problemes.map((p) => p.code)).toEqual(['reference-inconnue'])
    expect(problemes[0]?.message).toContain('absent')
  })

  it('signale un mot qui porte un champ contient non vide', () => {
    const problemes = validerStructure(construire([mot('aghroum'), mot('aman', { contient: ['aghroum'] })]))
    expect(problemes.map((p) => p.code)).toEqual(['mot-avec-contient'])
  })

  it('signale une phrase qui se référence elle-même', () => {
    const phrase = mot('boucle', { type: 'phrase', contient: ['boucle'] })
    expect(validerStructure(construire([phrase])).map((p) => p.code)).toEqual(['auto-reference'])
  })

  it('accumule plusieurs problèmes plutôt que de s’arrêter au premier', () => {
    const problemes = validerStructure(
      construire([mot('aman'), mot('aman'), mot('azrem', { themes: ['inexistant'] })]),
    )
    expect(problemes.map((p) => p.code).sort()).toEqual(['id-duplique', 'theme-inconnu'])
  })
})
