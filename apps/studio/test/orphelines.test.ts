import { describe, expect, it } from 'vitest'
import { ecarterPhrasesOrphelines } from '@/publication/phrases.js'
import type { LigneEntree } from '@/db/schema.js'

function ligne(id: string, contient: string[] = [], type = 'mot'): LigneEntree {
  return {
    id, type, kabyle: id, kabyleStd: null, fr: id, audio: `audio/${id}.wav`,
    variante: 'kabyle-nord', picto: 'openmoji:1F35E', themes: ['t'], niveau: 1,
    pluriel: null, contient, notes: '', aValider: false, ordre: 0,
    creeLe: new Date('2026-09-01T00:00:00.000Z'),
  }
}

describe('ecarterPhrasesOrphelines', () => {
  it('garde une phrase dont tous les mots sont présents', () => {
    const lignes = [ligne('etch'), ligne('aghroum'), ligne('etch-aghroum', ['etch', 'aghroum'], 'phrase')]
    expect(ecarterPhrasesOrphelines(lignes).map((l) => l.id)).toContain('etch-aghroum')
  })

  it('écarte une phrase dont un mot manque', () => {
    // Le cas réel : la phrase est enregistrée avant le vocabulaire qu'elle emploie.
    const lignes = [ligne('etch'), ligne('etch-aghroum', ['etch', 'aghroum'], 'phrase')]
    expect(ecarterPhrasesOrphelines(lignes).map((l) => l.id)).toEqual(['etch'])
  })

  it('ne touche jamais aux mots', () => {
    const lignes = [ligne('aghroum'), ligne('aman')]
    expect(ecarterPhrasesOrphelines(lignes)).toHaveLength(2)
  })

  it('écarte plusieurs phrases indépendamment', () => {
    const lignes = [
      ligne('aman'),
      ligne('d-aman', ['aman'], 'phrase'),
      ligne('d-aghroum', ['aghroum'], 'phrase'),
    ]
    expect(ecarterPhrasesOrphelines(lignes).map((l) => l.id)).toEqual(['aman', 'd-aman'])
  })
})
