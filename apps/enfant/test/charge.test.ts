import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { appliquerResultats, composerSession } from '@/moteur/session.js'
import { estDue } from '@/moteur/leitner.js'
import { progressionVide, type Progression } from '@/moteur/types.js'

function corpus(taille: number): Entree[] {
  return Array.from({ length: taille }, (_, i) => ({
    id: `mot-${i}`, type: 'mot' as const, kabyle: `mot-${i}`, fr: `mot ${i}`,
    audio: `audio/mot-${i}.webm`, variante: 'kabyle-nord', picto: 'openmoji:1F35E',
    themes: ['t'], niveau: 1, contient: [], notes: '',
  }))
}

const OPTIONS = { taille: 12, plafondNouveaux: 5, niveauMax: 3 }

interface Jour {
  taille: number
  /** Entrées dues que la session n'a pas pu traiter : la dette de révision. */
  arriere: number
  vus: number
}

/**
 * Le mode de défaillance qui tue les applications de langue : la dette de
 * révision qui enfle jusqu'à devenir décourageante. Invisible en test manuel,
 * puisqu'il faut six semaines pour l'observer.
 */
function simuler(tauxReussite: number, jours = 60): Jour[] {
  const entrees = corpus(213)
  let progression: Progression = progressionVide()
  const journal: Jour[] = []

  for (let n = 0; n < jours; n++) {
    const date = new Date(Date.UTC(2026, 8, 7 + n, 8))
    const lot = composerSession(entrees, progression, OPTIONS, date)

    const dues = entrees.filter((e) => {
      const etat = progression.etats[e.id]
      return etat !== undefined && estDue(etat, date)
    }).length

    journal.push({
      taille: lot.length,
      arriere: Math.max(0, dues - lot.length),
      vus: Object.keys(progression.etats).length,
    })

    progression = appliquerResultats(
      progression,
      lot.map((e, i) => ({ entreeId: e.id, reussi: i / Math.max(1, lot.length) < tauxReussite })),
      date,
    )
  }
  return journal
}

describe('charge sur soixante jours', () => {
  it('ne dépasse jamais la taille cible, enfant appliqué', () => {
    expect(Math.max(...simuler(0.9).map((j) => j.taille))).toBeLessThanOrEqual(OPTIONS.taille)
  })

  it('ne dépasse jamais la taille cible, enfant en difficulté', () => {
    expect(Math.max(...simuler(0.4).map((j) => j.taille))).toBeLessThanOrEqual(OPTIONS.taille)
  })

  // Le vrai indicateur n'est pas un plafond arbitraire sur l'arriéré — une dette
  // transitoire d'une session est normale — mais sa non-divergence : il doit
  // rester borné et se résorber. Un moteur qui empile les révisions échouerait
  // sur la seconde assertion, pas nécessairement sur la première.
  for (const [profil, taux] of [['appliqué', 0.9], ['en difficulté', 0.4]] as const) {
    it(`garde une dette de révision bornée, enfant ${profil}`, () => {
      const journal = simuler(taux)
      expect(Math.max(...journal.map((j) => j.arriere))).toBeLessThanOrEqual(OPTIONS.taille * 2)
    })

    it(`résorbe la dette de révision, enfant ${profil}`, () => {
      const dernierTiers = simuler(taux).slice(40)
      expect(dernierTiers.some((j) => j.arriere === 0)).toBe(true)
    })
  }

  it('continue de proposer du travail au bout de deux mois', () => {
    expect(simuler(0.8).slice(-7).every((j) => j.taille > 0)).toBe(true)
  })

  it('introduit un volume de vocabulaire crédible en deux mois', () => {
    const fin = simuler(1)[59]!
    expect(fin.vus).toBeGreaterThan(100)
    expect(fin.vus).toBeLessThanOrEqual(213)
  })
})
