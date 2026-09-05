import type { StockageMedias } from '@/stockage/types'
import { depotVide, schemaDepot, type Depot, type EntreeSource } from './types'

/** Source de vérité du corpus, dans le stockage à côté des médias. */
export const CLE_SOURCE = 'corpus/source.json'

/**
 * Lit la source de vérité.
 *
 * L'absence du fichier signifie « premier lancement » et rend un dépôt vide.
 * En revanche un fichier illisible provoque une erreur : l'écraser par un
 * dépôt vide effacerait tout le travail d'enregistrement.
 */
export async function lireDepot(stockage: StockageMedias): Promise<Depot> {
  const octets = await stockage.lire(CLE_SOURCE)
  if (!octets) return depotVide()

  let brut: unknown
  try {
    brut = JSON.parse(new TextDecoder().decode(octets))
  } catch (cause) {
    throw new Error(
      `La source du corpus (${CLE_SOURCE}) n'est pas du JSON lisible. ` +
        `Restaurer une version antérieure plutôt que de publier. Cause : ${String(cause)}`,
    )
  }

  return schemaDepot.parse(brut)
}

export async function ecrireDepot(stockage: StockageMedias, depot: Depot): Promise<void> {
  // Indenté : le fichier est la sauvegarde, autant qu'il soit relisible à l'œil.
  const contenu = new TextEncoder().encode(JSON.stringify(depot, null, 2))
  await stockage.ecrire(CLE_SOURCE, contenu, 'application/json')
}

/**
 * Applique une modification à une entrée, puis réécrit la source.
 *
 * Lecture, modification, écriture en une fonction : c'est le seul chemin par
 * lequel le studio touche à la source, ce qui évite qu'un appelant oublie de
 * réécrire ou réécrive un dépôt périmé.
 */
export async function modifierEntree(
  stockage: StockageMedias,
  id: string,
  transformer: (courante: EntreeSource) => EntreeSource,
): Promise<Depot> {
  const depot = await lireDepot(stockage)
  const index = depot.entrees.findIndex((entree) => entree.id === id)
  if (index === -1) throw new Error(`Entrée inconnue : ${id}`)

  const entrees = [...depot.entrees]
  entrees[index] = transformer(entrees[index]!)

  const suivant: Depot = { ...depot, entrees }
  await ecrireDepot(stockage, suivant)
  return suivant
}
