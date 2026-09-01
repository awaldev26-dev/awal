import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extraireCorpus, versSlug } from '../seed/extraire.js'

const markdown = readFileSync(
  join(import.meta.dirname, '../../../docs/corpus-v1.md'),
  'utf8',
)

describe('versSlug', () => {
  it('met en minuscules et remplace les espaces', () => {
    expect(versSlug('amek thellidh ?')).toBe('amek-thellidh')
  })

  it('conserve le chiffre 3 qui note une consonne', () => {
    expect(versSlug('a3oudiw')).toBe('a3oudiw')
  })

  it('supprime la ponctuation', () => {
    expect(versSlug('d achou-t ?')).toBe('d-achou-t')
  })
})

describe('extraireCorpus', () => {
  const { themes, entrees } = extraireCorpus(markdown)

  it('trouve les onze thèmes', () => {
    expect(themes).toHaveLength(11)
    expect(themes.map((t) => t.nom)).toContain('Les verbes')
  })

  it('extrait toutes les entrées du document', () => {
    expect(entrees.length).toBe(213)
  })

  it('produit des identifiants uniques', () => {
    expect(new Set(entrees.map((e) => e.id)).size).toBe(entrees.length)
  })

  it('rattache chaque entrée à un thème connu', () => {
    const ids = new Set(themes.map((t) => t.id))
    expect(entrees.every((e) => ids.has(e.theme))).toBe(true)
  })

  it('marque comme à valider les entrées portant un avertissement', () => {
    const setti = entrees.find((e) => e.kabyle === 'setti')
    expect(setti?.aValider).toBe(true)
  })

  it('sort la précision entre parenthèses du mot vers les notes', () => {
    const yiwen = entrees.find((e) => e.id === 'yiwen')
    expect(yiwen?.kabyle).toBe('yiwen')
    expect(yiwen?.notes).toContain('fém. yiwet')
  })

  it('suffixe les homonymes plutôt que de les écraser', () => {
    expect(entrees.find((e) => e.id === 'lekhrif')?.fr).toBe('figue')
    expect(entrees.find((e) => e.id === 'lekhrif-2')?.fr).toBe('automne')
  })

  it('renseigne toujours kabyle et français', () => {
    expect(entrees.every((e) => e.kabyle.length > 0 && e.fr.length > 0)).toBe(true)
  })
})
