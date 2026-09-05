import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { StockageDisque } from '@/stockage/disque'
import { CLE_SOURCE, lireDepot, modifierEntree, ecrireDepot } from '@/depot/depot'
import { depotVide, type Depot } from '@/depot/types'

const racines: string[] = []

function stockage() {
  const racine = mkdtempSync(join(tmpdir(), 'awal-depot-'))
  racines.push(racine)
  return new StockageDisque(racine, '/')
}

afterEach(() => {
  for (const racine of racines.splice(0)) rmSync(racine, { recursive: true, force: true })
})

function entree(id: string, reste: Record<string, unknown> = {}) {
  return {
    id,
    type: 'mot' as const,
    kabyle: id,
    fr: id,
    picto: 'openmoji:1F35E',
    themes: ['t'],
    ...reste,
  }
}

describe('lireDepot', () => {
  it('rend un dépôt vide quand le fichier n’existe pas', async () => {
    // Premier lancement : il n'y a rien à lire, ce n'est pas une erreur.
    expect(await lireDepot(stockage())).toEqual(depotVide())
  })

  it('relit ce qui a été écrit', async () => {
    const s = stockage()
    await ecrireDepot(s, { ...depotVide(), entrees: [entree('aghroum')] as Depot['entrees'] })
    const relu = await lireDepot(s)
    expect(relu.entrees).toHaveLength(1)
    expect(relu.entrees[0]?.kabyle).toBe('aghroum')
  })

  it('applique les valeurs par défaut aux champs absents', async () => {
    const s = stockage()
    await s.ecrire(
      CLE_SOURCE,
      new TextEncoder().encode(JSON.stringify({ entrees: [entree('aman')] })),
      'application/json',
    )
    const relu = await lireDepot(s)
    expect(relu.entrees[0]?.audio).toBeNull()
    expect(relu.entrees[0]?.aValider).toBe(true)
    expect(relu.entrees[0]?.niveau).toBe(1)
    expect(relu.format).toBe(1)
  })

  it('rejette un fichier corrompu plutôt que de perdre les données', async () => {
    // Écraser un dépôt illisible par un dépôt vide effacerait tout le travail :
    // mieux vaut refuser de démarrer.
    const s = stockage()
    await s.ecrire(CLE_SOURCE, new TextEncoder().encode('{ pas du json'), 'application/json')
    await expect(lireDepot(s)).rejects.toThrow()
  })

  it('rejette un dépôt dont une entrée est invalide', async () => {
    const s = stockage()
    await s.ecrire(
      CLE_SOURCE,
      new TextEncoder().encode(JSON.stringify({ entrees: [{ id: 'x', kabyle: 'x' }] })),
      'application/json',
    )
    await expect(lireDepot(s)).rejects.toThrow()
  })
})

describe('modifierEntree', () => {
  it('applique la modification et renvoie le dépôt', async () => {
    const s = stockage()
    await ecrireDepot(s, { ...depotVide(), entrees: [entree('aghroum')] as Depot['entrees'] })

    const apres = await modifierEntree(s, 'aghroum', (courante) => ({
      ...courante,
      fr: 'le pain',
      aValider: false,
    }))

    expect(apres.entrees[0]?.fr).toBe('le pain')
    expect(apres.entrees[0]?.aValider).toBe(false)
    expect((await lireDepot(s)).entrees[0]?.fr).toBe('le pain')
  })

  it('ne touche pas aux autres entrées', async () => {
    const s = stockage()
    await ecrireDepot(s, {
      ...depotVide(),
      entrees: [entree('aghroum'), entree('aman')] as Depot['entrees'],
    })
    const apres = await modifierEntree(s, 'aman', (c) => ({ ...c, fr: 'eau' }))
    expect(apres.entrees.find((e) => e.id === 'aghroum')?.fr).toBe('aghroum')
  })

  it('échoue si l’entrée n’existe pas', async () => {
    const s = stockage()
    await ecrireDepot(s, depotVide())
    await expect(modifierEntree(s, 'fantome', (c) => c)).rejects.toThrow(/fantome/)
  })

  it('conserve l’ordre des entrées', async () => {
    const s = stockage()
    const trois = ['a', 'b', 'c'].map((id, rang) => entree(id, { ordre: rang }))
    await ecrireDepot(s, { ...depotVide(), entrees: trois as Depot['entrees'] })
    const apres = await modifierEntree(s, 'b', (c) => ({ ...c, fr: 'modifié' }))
    expect(apres.entrees.map((e) => e.id)).toEqual(['a', 'b', 'c'])
  })
})
