import { describe, expect, it } from 'vitest'
import { schemaArtefact } from '../src/artefact.js'
import { validerMedias } from '../src/medias.js'
import type { VerificateurMedias } from '../src/medias.js'
import type { Artefact } from '../src/artefact.js'

function construire(ids: string[]): Artefact {
  return schemaArtefact.parse({
    version: 1,
    publieLe: '2026-09-01T18:00:00.000Z',
    urlBaseMedias: 'https://media.awal.app/',
    themes: [{ id: 'manger-et-boire', nom: 'Manger', picto: 'openmoji:1F35E', couleur: '#c94f3d' }],
    entrees: ids.map((id) => ({
      id,
      type: 'mot',
      kabyle: id,
      fr: id,
      audio: `audio/${id}.opus`,
      variante: 'kabyle-nord',
      picto: `openmoji:1F3${(100 + ids.indexOf(id)).toString(16).toUpperCase()}`,
      themes: ['manger-et-boire'],
    })),
  })
}

function pictoDe(ids: string[], id: string): string {
  return `openmoji:1F3${(100 + ids.indexOf(id)).toString(16).toUpperCase()}`
}

function verificateur(audiosPresents: string[], pictosPresents: string[]): VerificateurMedias {
  return {
    audioExiste: async (cle) => audiosPresents.includes(cle),
    pictoExiste: async (reference) => pictosPresents.includes(reference),
  }
}

describe('validerMedias', () => {
  it('ne signale rien quand tous les médias sont présents', async () => {
    const artefact = construire(['aghroum'])
    const problemes = await validerMedias(
      artefact,
      verificateur(['audio/aghroum.opus'], [pictoDe(['aghroum'], 'aghroum')]),
    )
    expect(problemes).toEqual([])
  })

  it('signale un audio absent', async () => {
    const artefact = construire(['aghroum'])
    const problemes = await validerMedias(
      artefact,
      verificateur([], [pictoDe(['aghroum'], 'aghroum')]),
    )
    expect(problemes.map((p) => p.code)).toEqual(['audio-absent'])
    expect(problemes[0]?.entreeId).toBe('aghroum')
  })

  it('signale un picto absent', async () => {
    const artefact = construire(['aman'])
    const problemes = await validerMedias(artefact, verificateur(['audio/aman.opus'], []))
    expect(problemes.map((p) => p.code)).toEqual(['picto-absent'])
  })

  it('signale les deux quand les deux manquent', async () => {
    const problemes = await validerMedias(construire(['idh']), verificateur([], []))
    expect(problemes.map((p) => p.code).sort()).toEqual(['audio-absent', 'picto-absent'])
  })

  it('vérifie toutes les entrées, pas seulement la première', async () => {
    const artefact = construire(['aghroum', 'aman', 'idh'])
    const problemes = await validerMedias(
      artefact,
      verificateur(
        ['audio/aghroum.opus'],
        ['aghroum', 'aman', 'idh'].map((id) => pictoDe(['aghroum', 'aman', 'idh'], id)),
      ),
    )
    expect(problemes.map((p) => p.entreeId).sort()).toEqual(['aman', 'idh'])
  })
})
