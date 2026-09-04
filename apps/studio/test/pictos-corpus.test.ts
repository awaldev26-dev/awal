import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extraireCorpus } from '../seed/extraire'
import { COULEUR_PAR_THEME, PICTOS, PICTO_PAR_THEME, pictoPour } from '../seed/pictos'
import { pictoValide } from '@awal/corpus'

const { themes, entrees } = extraireCorpus(
  readFileSync(join(import.meta.dirname, '../../../docs/corpus-v1.md'), 'utf8'),
)

describe('table des pictos', () => {
  it('couvre chaque entrée du corpus', () => {
    const sans = entrees.filter((e) => !PICTOS[e.id]).map((e) => e.id)
    expect(sans).toEqual([])
  })

  it('ne contient aucune clé orpheline', () => {
    const ids = new Set(entrees.map((e) => e.id))
    expect(Object.keys(PICTOS).filter((cle) => !ids.has(cle))).toEqual([])
  })

  it('n’emploie jamais deux fois le même emoji', () => {
    // Deux emojis identiques rendraient insoluble une question à quatre choix.
    expect(new Set(Object.values(PICTOS)).size).toBe(Object.keys(PICTOS).length)
  })

  it('ne produit que des références valides', () => {
    expect(entrees.every((e) => pictoValide(pictoPour(e.id, e.theme)))).toBe(true)
  })

  it('donne un repli et une couleur à chaque thème', () => {
    for (const theme of themes) {
      expect(PICTO_PAR_THEME[theme.id], theme.id).toBeDefined()
      expect(COULEUR_PAR_THEME[theme.id], theme.id).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
