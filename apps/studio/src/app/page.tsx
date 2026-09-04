import { asc } from 'drizzle-orm'
import { db } from '@/db/index'
import { entrees, publications, themes } from '@/db/schema'
import { creerStockage } from '@/stockage/index'
import { Studio } from './composants/Studio'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [lignes, listeThemes, faites] = await Promise.all([
    db.select().from(entrees).orderBy(asc(entrees.ordre), asc(entrees.id)),
    db.select().from(themes).orderBy(asc(themes.ordre)),
    db.select().from(publications),
  ])

  const derniere = faites.map((publication) => publication.version).sort((a, b) => b - a)[0] ?? null

  // Le studio lit ses propres médias par sa route /medias, quel que soit le
  // stockage : c'est la seule URL valable en développement comme en production.
  return (
    <Studio
      entrees={lignes}
      themes={listeThemes}
      derniereVersion={derniere}
      urlBase="/medias/"
    />
  )
}
