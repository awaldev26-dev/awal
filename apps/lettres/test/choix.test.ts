import { describe, expect, it } from 'vitest'
import { ALPHABET, type Lettre } from '@/alphabet'
import { tirerQuestion } from '@/choix'

describe('tirerQuestion', () => {
  it('place toujours la cible parmi les propositions', () => {
    // L'invariant qui compte : une question dont la réponse est absente serait
    // insoluble, et une enfant de trois ans ne pourrait pas le signaler.
    for (let essai = 0; essai < 200; essai += 1) {
      const q = tirerQuestion(ALPHABET, 3)
      expect(q).not.toBeNull()
      expect(q!.propositions).toContain(q!.cible)
    }
  })

  it('rend le nombre demandé de propositions, toutes distinctes', () => {
    for (let essai = 0; essai < 200; essai += 1) {
      const q = tirerQuestion(ALPHABET, 3)!
      expect(q.propositions).toHaveLength(3)
      expect(new Set(q.propositions.map((l) => l.glyphe)).size).toBe(3)
    }
  })

  it('finit par proposer chacune des 26 lettres', () => {
    // Un mélange biaisé laisserait des lettres de côté : elles ne seraient
    // jamais apprises, sans que rien ne le signale.
    const vues = new Set<string>()
    for (let essai = 0; essai < 3000; essai += 1) {
      for (const l of tirerQuestion(ALPHABET, 3)!.propositions) vues.add(l.glyphe)
    }
    expect(vues.size).toBe(26)
  })

  it('finit par choisir chacune des 26 lettres comme cible', () => {
    const cibles = new Set<string>()
    for (let essai = 0; essai < 3000; essai += 1) {
      cibles.add(tirerQuestion(ALPHABET, 3)!.cible.glyphe)
    }
    expect(cibles.size).toBe(26)
  })

  it('ne boucle pas quand on demande plus de lettres qu’il n’en existe', () => {
    const deux: Lettre[] = [
      { glyphe: 'A', dit: 'a' },
      { glyphe: 'B', dit: 'bé' },
    ]
    const q = tirerQuestion(deux, 5)!
    expect(q.propositions).toHaveLength(2)
    expect(q.propositions).toContain(q.cible)
  })

  it('ne modifie pas l’alphabet qu’on lui passe', () => {
    const avant = ALPHABET.map((l) => l.glyphe).join('')
    tirerQuestion(ALPHABET, 3)
    expect(ALPHABET.map((l) => l.glyphe).join('')).toBe(avant)
  })

  it('rend null sur un alphabet vide ou un nombre absurde', () => {
    expect(tirerQuestion([], 3)).toBeNull()
    expect(tirerQuestion(ALPHABET, 0)).toBeNull()
  })
})
