import { describe, expect, it } from 'vitest'
import {
  BOITE_ACQUISE, DELAIS_JOURS, NB_BOITES,
  apresReponse, estAcquise, estDue, jour, nouvelEtat,
} from '@/moteur/leitner'

const LUNDI = new Date('2026-09-07T08:00:00.000Z')
const LUNDI_SOIR = new Date('2026-09-07T22:30:00.000Z')
const MARDI = new Date('2026-09-08T08:00:00.000Z')

describe('jour', () => {
  it('réduit une date à son jour calendaire', () => {
    expect(jour(LUNDI)).toBe('2026-09-07')
    expect(jour(LUNDI_SOIR)).toBe('2026-09-07')
  })
})

describe('nouvelEtat', () => {
  it('démarre en boîte 1, due le jour même', () => {
    const etat = nouvelEtat(LUNDI)
    expect(etat.boite).toBe(1)
    expect(estDue(etat, LUNDI)).toBe(true)
  })
})

describe('apresReponse', () => {
  it('monte d’une boîte en cas de réussite', () => {
    expect(apresReponse(nouvelEtat(LUNDI), true, LUNDI).boite).toBe(2)
  })

  it('ne dépasse jamais la dernière boîte', () => {
    let etat = nouvelEtat(LUNDI)
    for (let i = 0; i < 20; i++) etat = apresReponse(etat, true, LUNDI)
    expect(etat.boite).toBe(NB_BOITES)
  })

  it('retombe en boîte 1 en cas d’échec', () => {
    let etat = nouvelEtat(LUNDI)
    etat = apresReponse(etat, true, LUNDI)
    etat = apresReponse(etat, true, LUNDI)
    expect(etat.boite).toBe(3)
    expect(apresReponse(etat, false, LUNDI).boite).toBe(1)
  })

  it('reporte la révision du délai de la nouvelle boîte', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(etat.boite).toBe(2)
    expect(etat.prochaine).toBe('2026-09-09')
  })

  it('applique le délai de la boîte 1 après un échec', () => {
    let etat = nouvelEtat(LUNDI)
    etat = apresReponse(etat, true, LUNDI)
    etat = apresReponse(etat, false, LUNDI)
    expect(etat.prochaine).toBe('2026-09-08')
  })
})

describe('estDue', () => {
  it('n’est pas due avant sa date', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(estDue(etat, MARDI)).toBe(false)
  })

  it('est due le jour dit', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(estDue(etat, new Date('2026-09-09T06:00:00.000Z'))).toBe(true)
  })

  it('reste due si le jour est passé', () => {
    const etat = apresReponse(nouvelEtat(LUNDI), true, LUNDI)
    expect(estDue(etat, new Date('2026-10-01T06:00:00.000Z'))).toBe(true)
  })
})

describe('estAcquise', () => {
  it('n’est pas acquise avant la boîte seuil', () => {
    expect(estAcquise({ boite: BOITE_ACQUISE - 1, prochaine: '2026-09-07' })).toBe(false)
  })

  it('est acquise à partir de la boîte seuil', () => {
    expect(estAcquise({ boite: BOITE_ACQUISE, prochaine: '2026-09-07' })).toBe(true)
  })
})

describe('DELAIS_JOURS', () => {
  it('couvre toutes les boîtes et croît', () => {
    const delais = Array.from({ length: NB_BOITES }, (_, i) => DELAIS_JOURS[i + 1])
    expect(delais).toEqual([1, 2, 4, 7, 14])
  })
})
