import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { MAX_PHRASES_NOUVELLES, OPTIONS_PAR_AGE, appliquerResultats, composerSession, serie } from '@/moteur/session.js'
import { progressionVide, type Progression } from '@/moteur/types.js'
import { jour } from '@/moteur/leitner.js'

const LUNDI = new Date('2026-09-07T08:00:00.000Z')

function entree(id: string, niveau = 1): Entree {
  return {
    id, type: 'mot', kabyle: id, fr: id, audio: `audio/${id}.webm`,
    variante: 'kabyle-nord', picto: 'openmoji:1F35E', themes: ['t'],
    niveau, contient: [], notes: '',
  }
}

const vingtMots = Array.from({ length: 20 }, (_, i) => entree(`mot-${i}`))

describe('OPTIONS_PAR_AGE', () => {
  it('plafonne à 5 nouveautés pour un enfant de 6 ans', () => {
    expect(OPTIONS_PAR_AGE(6).plafondNouveaux).toBe(5)
  })

  it('plafonne à 8 nouveautés pour un enfant de 9 ans', () => {
    expect(OPTIONS_PAR_AGE(9).plafondNouveaux).toBe(8)
  })

  it('n’ouvre que le niveau 1 aux plus jeunes', () => {
    expect(OPTIONS_PAR_AGE(6).niveauMax).toBe(1)
    expect(OPTIONS_PAR_AGE(9).niveauMax).toBe(3)
  })
})

describe('composerSession', () => {
  const options = { taille: 12, plafondNouveaux: 5, niveauMax: 3 }

  it('respecte le plafond de nouveautés au premier jour', () => {
    expect(composerSession(vingtMots, progressionVide(), options, LUNDI)).toHaveLength(5)
  })

  it('ne dépasse jamais la taille demandée', () => {
    const progression = progressionVide()
    for (const e of vingtMots) progression.etats[e.id] = { boite: 1, prochaine: '2026-09-01' }
    expect(composerSession(vingtMots, progression, options, LUNDI)).toHaveLength(12)
  })

  it('sert d’abord les révisions dues, puis complète en nouveautés', () => {
    const progression = progressionVide()
    for (const e of vingtMots.slice(0, 4)) {
      progression.etats[e.id] = { boite: 2, prochaine: '2026-09-01' }
    }
    const lot = composerSession(vingtMots, progression, options, LUNDI)
    expect(lot.filter((e) => progression.etats[e.id])).toHaveLength(4)
    expect(lot).toHaveLength(9)
  })

  it('sacrifie les nouveautés quand les révisions saturent la session', () => {
    // Protection contre l'emballement : un enfant en retard ne reçoit pas
    // de vocabulaire supplémentaire par-dessus sa dette.
    const progression = progressionVide()
    for (const e of vingtMots.slice(0, 15)) {
      progression.etats[e.id] = { boite: 1, prochaine: '2026-09-01' }
    }
    const lot = composerSession(vingtMots, progression, options, LUNDI)
    expect(lot).toHaveLength(12)
    expect(lot.every((e) => progression.etats[e.id] !== undefined)).toBe(true)
  })

  it('ignore les entrées non encore dues', () => {
    const progression = progressionVide()
    for (const e of vingtMots) progression.etats[e.id] = { boite: 3, prochaine: '2026-12-01' }
    expect(composerSession(vingtMots, progression, options, LUNDI)).toEqual([])
  })

  it('n’introduit plus de nouveautés une fois le plafond du jour atteint', () => {
    const progression = progressionVide()
    progression.nouveauxParJour[jour(LUNDI)] = 5
    expect(composerSession(vingtMots, progression, options, LUNDI)).toEqual([])
  })

  it('filtre les entrées au-dessus du niveau du profil', () => {
    const melange = [entree('facile', 1), entree('dur', 3)]
    const lot = composerSession(melange, progressionVide(), { ...options, niveauMax: 1 }, LUNDI)
    expect(lot.map((e) => e.id)).toEqual(['facile'])
  })
})

describe('appliquerResultats', () => {
  it('crée l’état d’une entrée vue pour la première fois', () => {
    const p = appliquerResultats(progressionVide(), [{ entreeId: 'a', reussi: true }], LUNDI)
    expect(p.etats.a?.boite).toBe(2)
  })

  it('compte les nouveautés du jour', () => {
    const p = appliquerResultats(
      progressionVide(),
      [{ entreeId: 'a', reussi: true }, { entreeId: 'b', reussi: false }],
      LUNDI,
    )
    expect(p.nouveauxParJour[jour(LUNDI)]).toBe(2)
  })

  it('ne recompte pas une entrée déjà connue', () => {
    let p: Progression = appliquerResultats(progressionVide(), [{ entreeId: 'a', reussi: true }], LUNDI)
    p = appliquerResultats(p, [{ entreeId: 'a', reussi: true }], LUNDI)
    expect(p.nouveauxParJour[jour(LUNDI)]).toBe(1)
  })

  it('enregistre le jour joué une seule fois', () => {
    let p = appliquerResultats(progressionVide(), [{ entreeId: 'a', reussi: true }], LUNDI)
    p = appliquerResultats(p, [{ entreeId: 'b', reussi: true }], LUNDI)
    expect(p.joursJoues).toEqual([jour(LUNDI)])
  })

  it('ne modifie pas la progression reçue', () => {
    const origine = progressionVide()
    appliquerResultats(origine, [{ entreeId: 'a', reussi: true }], LUNDI)
    expect(origine.etats).toEqual({})
  })
})

describe('serie', () => {
  it('vaut zéro sans aucun jour joué', () => {
    expect(serie(progressionVide(), LUNDI)).toBe(0)
  })

  it('compte les jours consécutifs', () => {
    const p = { ...progressionVide(), joursJoues: ['2026-09-05', '2026-09-06', '2026-09-07'] }
    expect(serie(p, LUNDI)).toBe(3)
  })

  it('tolère un jour manqué', () => {
    // Une soirée chez les grands-parents ne doit pas effacer trente jours.
    const p = { ...progressionVide(), joursJoues: ['2026-09-04', '2026-09-05', '2026-09-07'] }
    expect(serie(p, LUNDI)).toBe(3)
  })

  it('s’interrompt après deux jours manqués', () => {
    const p = { ...progressionVide(), joursJoues: ['2026-09-01', '2026-09-02', '2026-09-07'] }
    expect(serie(p, LUNDI)).toBe(1)
  })
})

describe('priorité des phrases nouvelles', () => {
  const options = { taille: 12, plafondNouveaux: 5, niveauMax: 3 }

  function phrase(id: string, contient: string[]): Entree {
    return { ...entree(id), type: 'phrase', contient }
  }

  it('ne propose pas une phrase dont les mots ne sont pas connus', () => {
    const corpus = [entree('etch'), entree('aghroum'), phrase('etch-aghroum', ['etch', 'aghroum'])]
    const lot = composerSession(corpus, progressionVide(), options, LUNDI)
    expect(lot.map((e) => e.id)).not.toContain('etch-aghroum')
  })

  it('fait passer une phrase débloquée avant les mots nouveaux', () => {
    // Les phrases sont en fin de corpus : sans priorité explicite, elles
    // n'arriveraient qu'après les 213 mots, donc jamais.
    const progression = progressionVide()
    progression.etats.etch = { boite: 2, prochaine: '2026-12-01' }
    progression.etats.aghroum = { boite: 2, prochaine: '2026-12-01' }
    const corpus = [...vingtMots, phrase('etch-aghroum', ['etch', 'aghroum'])]
    const lot = composerSession(corpus, progression, options, LUNDI)
    expect(lot[0]?.id).toBe('etch-aghroum')
  })

  it('plafonne les phrases nouvelles par session', () => {
    const progression = progressionVide()
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
      progression.etats[id] = { boite: 3, prochaine: '2026-12-01' }
    }
    const corpus = [
      ...vingtMots,
      phrase('p1', ['a', 'b']), phrase('p2', ['c', 'd']), phrase('p3', ['e', 'f']),
    ]
    const lot = composerSession(corpus, progression, options, LUNDI)
    expect(lot.filter((e) => e.type === 'phrase')).toHaveLength(MAX_PHRASES_NOUVELLES)
  })
})
