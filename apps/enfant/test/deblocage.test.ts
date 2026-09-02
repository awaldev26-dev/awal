import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { BOITE_MOT_CONNU, phraseDebloquee } from '@/moteur/phrases.js'
import { progressionVide, type Progression } from '@/moteur/types.js'

function mot(id: string): Entree {
  return {
    id, type: 'mot', kabyle: id, fr: id, audio: `audio/${id}.wav`, variante: 'v',
    picto: 'openmoji:1F35E', themes: ['t'], niveau: 1, contient: [], notes: '',
  }
}

function phrase(id: string, contient: string[]): Entree {
  return { ...mot(id), type: 'phrase', contient }
}

function avecBoites(boites: Record<string, number>): Progression {
  const p = progressionVide()
  for (const [id, boite] of Object.entries(boites)) p.etats[id] = { boite, prochaine: '2026-09-07' }
  return p
}

describe('phraseDebloquee', () => {
  it('laisse toujours passer un mot', () => {
    expect(phraseDebloquee(mot('aghroum'), progressionVide())).toBe(true)
  })

  it('débloque une phrase dont tous les mots sont connus', () => {
    const p = avecBoites({ etch: BOITE_MOT_CONNU, aghroum: BOITE_MOT_CONNU })
    expect(phraseDebloquee(phrase('etch-aghroum', ['etch', 'aghroum']), p)).toBe(true)
  })

  it('bloque une phrase dont un mot est encore en boîte 1', () => {
    // Boîte 1 = rencontré mais jamais réussi : la phrase serait du charabia.
    const p = avecBoites({ etch: BOITE_MOT_CONNU, aghroum: 1 })
    expect(phraseDebloquee(phrase('etch-aghroum', ['etch', 'aghroum']), p)).toBe(false)
  })

  it('bloque une phrase dont un mot n’a jamais été vu', () => {
    const p = avecBoites({ etch: 3 })
    expect(phraseDebloquee(phrase('etch-aghroum', ['etch', 'aghroum']), p)).toBe(false)
  })

  it('accepte une boîte supérieure au seuil', () => {
    const p = avecBoites({ etch: 5, aghroum: 4 })
    expect(phraseDebloquee(phrase('etch-aghroum', ['etch', 'aghroum']), p)).toBe(true)
  })

  it('laisse passer une phrase sans dépendance déclarée', () => {
    expect(phraseDebloquee(phrase('seule', []), progressionVide())).toBe(true)
  })

  it('exige tous les mots, pas seulement le premier', () => {
    const p = avecBoites({ a: 3, b: 3, c: 1 })
    expect(phraseDebloquee(phrase('abc', ['a', 'b', 'c']), p)).toBe(false)
  })
})
