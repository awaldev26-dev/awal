import { describe, expect, it } from 'vitest'
import type { Entree } from '@awal/corpus'
import { choisirDistracteurs } from '@/jeux/choisirDistracteurs'

function e(id: string, theme: string): Entree {
  return {
    id, type: 'mot', kabyle: id, fr: id, audio: `a/${id}`, variante: 'v',
    picto: `openmoji:1F40${id.length}`, themes: [theme], niveau: 1, contient: [], notes: '',
  }
}

const cible = e('amchich', 'animaux')
const memeTheme = [e('aydi', 'animaux'), e('izem', 'animaux'), e('ilef', 'animaux')]
const autreTheme = [e('aghroum', 'manger'), e('aman', 'manger')]

// Générateur déterministe : les tests ne doivent pas dépendre du hasard.
const alea = () => 0

describe('choisirDistracteurs', () => {
  it('rend le nombre demandé', () => {
    expect(choisirDistracteurs(cible, [...memeTheme, ...autreTheme], 3, alea)).toHaveLength(3)
  })

  it('n’inclut jamais la cible', () => {
    const tires = choisirDistracteurs(cible, [cible, ...memeTheme], 3, alea)
    expect(tires.map((x) => x.id)).not.toContain('amchich')
  })

  it('privilégie le même thème', () => {
    const tires = choisirDistracteurs(cible, [...autreTheme, ...memeTheme], 3, alea)
    expect(tires.every((x) => x.themes.includes('animaux'))).toBe(true)
  })

  it('complète avec d’autres thèmes quand le thème est trop pauvre', () => {
    const tires = choisirDistracteurs(cible, [e('aydi', 'animaux'), ...autreTheme], 3, alea)
    expect(tires).toHaveLength(3)
  })

  it('rend ce qu’il peut quand les candidats manquent', () => {
    expect(choisirDistracteurs(cible, [e('aydi', 'animaux')], 3, alea)).toHaveLength(1)
  })

  it('ne rend jamais deux fois la même entrée', () => {
    const tires = choisirDistracteurs(cible, [...memeTheme, ...autreTheme], 4, alea)
    expect(new Set(tires.map((x) => x.id)).size).toBe(tires.length)
  })
})
