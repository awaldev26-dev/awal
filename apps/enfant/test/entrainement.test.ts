import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { composerEntrainement, themesDisponibles } from '@/moteur/entrainement.js'
import { progressionVide, type Progression } from '@/moteur/types.js'

function entree(id: string, theme: string, niveau = 1): Entree {
  return {
    id, type: 'mot', kabyle: id, fr: id, audio: `audio/${id}.wav`,
    variante: 'kabyle-nord', picto: 'openmoji:1F35E', themes: [theme],
    niveau, contient: [], notes: '',
  }
}

const corpus = [
  entree('amchich', 'animaux'), entree('aydi', 'animaux'), entree('izem', 'animaux'),
  entree('aghroum', 'manger'), entree('aman', 'manger'),
  entree('dur', 'animaux', 3),
]

function avecBoites2(ids: string[]): Progression {
  const p = progressionVide()
  for (const id of ids) p.etats[id] = { boite: 2, prochaine: '2026-12-01' }
  return p
}

function vues(ids: string[]): Progression {
  const p = progressionVide()
  for (const id of ids) p.etats[id] = { boite: 2, prochaine: '2026-12-01' }
  return p
}

describe('composerEntrainement', () => {
  it('ne propose que du vocabulaire déjà rencontré', () => {
    const lot = composerEntrainement(corpus, vues(['amchich', 'aydi']), { taille: 10, niveauMax: 3 })
    expect(lot.map((e) => e.id).sort()).toEqual(['amchich', 'aydi'])
  })

  it('ignore la date de révision : on peut rejouer quand on veut', () => {
    // Toutes ces entrées sont révisables en décembre seulement ; l'entraînement
    // les propose quand même, c'est tout son intérêt.
    const lot = composerEntrainement(corpus, vues(['amchich']), { taille: 10, niveauMax: 3 })
    expect(lot).toHaveLength(1)
  })

  it('se limite à un thème quand on en demande un', () => {
    const p = vues(['amchich', 'aydi', 'aghroum'])
    const lot = composerEntrainement(corpus, p, { taille: 10, niveauMax: 3, theme: 'manger' })
    expect(lot.map((e) => e.id)).toEqual(['aghroum'])
  })

  it('respecte la taille demandée', () => {
    const lot = composerEntrainement(corpus, vues(['amchich', 'aydi', 'izem']), { taille: 2, niveauMax: 3 })
    expect(lot).toHaveLength(2)
  })

  it('respecte le niveau du profil', () => {
    const lot = composerEntrainement(corpus, vues(['amchich', 'dur']), { taille: 10, niveauMax: 1 })
    expect(lot.map((e) => e.id)).toEqual(['amchich'])
  })

  it('se rabat sur le vocabulaire du niveau quand rien n’a été rencontré', () => {
    // Le bouton « S'entraîner » est toujours actif : il ne doit jamais mener
    // à un écran où l'on ne peut rien faire.
    const lot = composerEntrainement(corpus, progressionVide(), { taille: 10, niveauMax: 3 })
    expect(lot.length).toBeGreaterThan(0)
    expect(lot.every((e) => e.niveau <= 3)).toBe(true)
  })

  it('respecte le niveau même en repli', () => {
    const lot = composerEntrainement(corpus, progressionVide(), { taille: 10, niveauMax: 1 })
    expect(lot.map((e) => e.id)).not.toContain('dur')
  })

  it('garde les phrases verrouillées en repli', () => {
    // Un débutant ne doit pas tomber sur une phrase dont il ignore les mots.
    const avecPhrase = [...corpus, { ...entree('etch-aghroum', 'manger'), type: 'phrase' as const, contient: ['etch', 'aghroum'] }]
    const lot = composerEntrainement(avecPhrase, progressionVide(), { taille: 20, niveauMax: 3 })
    expect(lot.map((e) => e.id)).not.toContain('etch-aghroum')
  })

  it('privilégie le vocabulaire rencontré quand il y en a', () => {
    const lot = composerEntrainement(corpus, vues(['amchich']), { taille: 10, niveauMax: 3 })
    expect(lot.map((e) => e.id)).toEqual(['amchich'])
  })

  it('mélange le lot pour ne pas rejouer le même ordre', () => {
    // alea = 0 fait tourner Fisher-Yates de façon déterministe : on peut donc
    // vérifier que le mélange est bien appliqué, et pas seulement qu'il diffère.
    const p = vues(['amchich', 'aydi', 'izem', 'aghroum', 'aman'])
    const lot = composerEntrainement(corpus, p, { taille: 5, niveauMax: 3 }, () => 0)
    expect(lot.map((e) => e.id)).toEqual(['aydi', 'izem', 'aghroum', 'aman', 'amchich'])
  })
})

describe('themesDisponibles', () => {
  const themes = [
    { id: 'animaux', nom: 'Animaux', picto: 'openmoji:1F408', couleur: '#111111' },
    { id: 'manger', nom: 'Manger', picto: 'openmoji:1F35E', couleur: '#222222' },
    { id: 'vide', nom: 'Vide', picto: 'openmoji:2753', couleur: '#333333' },
  ]

  it('compte les entrées rencontrées par thème', () => {
    const dispo = themesDisponibles(corpus, themes, vues(['amchich', 'aydi', 'aghroum']), 3)
    expect(dispo.map((d) => [d.theme.id, d.nombre])).toEqual([
      ['animaux', 2],
      ['manger', 1],
    ])
  })

  it('propose les thèmes non encore abordés, à zéro', () => {
    // Ils restent jouables : l'entraînement se rabat sur leur vocabulaire.
    const dispo = themesDisponibles(corpus, themes, vues(['amchich']), 3)
    expect(dispo.map((d) => [d.theme.id, d.nombre])).toEqual([
      ['animaux', 1],
      ['manger', 0],
    ])
  })

  it('écarte les thèmes qui n’ont aucune entrée du niveau', () => {
    // « vide » ne contient rien, et « animaux » n'a que du niveau 3.
    expect(themesDisponibles(corpus, themes, progressionVide(), 1).map((d) => d.theme.id))
      .toEqual(['animaux', 'manger'])
  })

  it('écarte un thème dont tout est verrouillé', () => {
    // Le thème des phrases ne doit pas s'afficher tant qu'aucune n'est
    // débloquée : le choisir ouvrirait sur un écran vide.
    const phrase = {
      ...corpus[0]!, id: 'etch-aghroum', type: 'phrase' as const,
      themes: ['phrases'], contient: ['etch', 'aghroum'],
    }
    const avecPhrases = [
      ...themes,
      { id: 'phrases', nom: 'Phrases', picto: 'openmoji:1F5E8', couleur: '#444444' },
    ]
    const dispo = themesDisponibles([...corpus, phrase], avecPhrases, progressionVide(), 3)
    expect(dispo.map((d) => d.theme.id)).not.toContain('phrases')
  })

  it('propose le thème des phrases dès qu’une est débloquée', () => {
    const phrase = {
      ...corpus[0]!, id: 'etch-aghroum', type: 'phrase' as const,
      themes: ['phrases'], contient: ['etch', 'aghroum'],
    }
    const avecPhrases = [
      ...themes,
      { id: 'phrases', nom: 'Phrases', picto: 'openmoji:1F5E8', couleur: '#444444' },
    ]
    const p = avecBoites2(['etch', 'aghroum'])
    const dispo = themesDisponibles([...corpus, phrase], avecPhrases, p, 3)
    expect(dispo.map((d) => d.theme.id)).toContain('phrases')
  })

  it('propose tous les thèmes fournis au tout début', () => {
    expect(themesDisponibles(corpus, themes, progressionVide(), 3).map((d) => d.theme.id))
      .toEqual(['animaux', 'manger'])
  })
})
