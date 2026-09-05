import { creerStockage } from '@/stockage/index'
import { lireDepot, ecrireDepot } from '@/depot/depot'
import { construireArtefact } from './construire'
import { ecarterPhrasesOrphelines } from './phrases'
import { publierArtefact, type ResultatPublication } from './publier'

/**
 * Lit la source, construit l'artefact et le publie.
 *
 * Les entrées sans audio sont écartées silencieusement : le studio affiche
 * déjà le compteur de prises, et refuser de publier tant qu'une seule manque
 * interdirait de tester avec un corpus partiel.
 */
export async function publierDepuisDepot(): Promise<ResultatPublication> {
  const stockage = creerStockage()
  const depot = await lireDepot(stockage)

  const publiables = ecarterPhrasesOrphelines(
    depot.entrees.filter((entree) => entree.audio !== null),
  )
  if (publiables.length === 0) {
    return {
      ok: false,
      problemes: [{ code: 'audio-absent', message: 'Aucune entrée enregistrée.' }],
    }
  }

  const version = Math.max(0, ...depot.publications.map((p) => p.version)) + 1
  const publieLe = new Date()

  const artefact = construireArtefact(publiables, depot.themes, {
    version,
    publieLe,
    urlBaseMedias: stockage.urlPublique(),
  })

  const resultat = await publierArtefact(artefact, stockage)
  if (resultat.ok) {
    await ecrireDepot(stockage, {
      ...depot,
      publications: [
        ...depot.publications,
        { version, publieLe: publieLe.toISOString(), nbEntrees: publiables.length },
      ],
    })
  }
  return resultat
}
