import { asc } from 'drizzle-orm'
import { db } from '@/db/index.js'
import { entrees, publications, themes } from '@/db/schema.js'
import { creerStockage } from '@/stockage/index.js'
import { construireArtefact } from './construire.js'
import { ecarterPhrasesOrphelines } from './phrases.js'
import { publierArtefact, type ResultatPublication } from './publier.js'

/**
 * Lit la base, construit l'artefact et le publie. Vit ici plutôt que dans
 * l'action serveur pour rester appelable en script et en test.
 *
 * Les entrées sans audio sont écartées silencieusement : le studio affiche
 * déjà le compteur « n/213 enregistrées », et refuser de publier tant qu'une
 * seule manque interdirait de tester avec un corpus partiel.
 */
export async function publierDepuisBase(): Promise<ResultatPublication> {
  const [lignes, listeThemes, faites] = await Promise.all([
    // L'ordre du document est un choix éditorial : l'artefact doit le porter.
    db.select().from(entrees).orderBy(asc(entrees.ordre), asc(entrees.id)),
    db.select().from(themes),
    db.select().from(publications),
  ])

  const publiables = ecarterPhrasesOrphelines(lignes.filter((ligne) => ligne.audio !== null))
  if (publiables.length === 0) {
    return { ok: false, problemes: [{ code: 'audio-absent', message: 'Aucune entrée enregistrée.' }] }
  }

  const version = Math.max(0, ...faites.map((p) => p.version)) + 1
  const stockage = creerStockage()

  const artefact = construireArtefact(publiables, listeThemes, {
    version,
    publieLe: new Date(),
    urlBaseMedias: stockage.urlPublique(),
  })

  const resultat = await publierArtefact(artefact, stockage)
  if (resultat.ok) {
    await db.insert(publications).values({ version, nbEntrees: publiables.length })
  }
  return resultat
}
