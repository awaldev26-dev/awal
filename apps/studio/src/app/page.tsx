import { lireDepot } from '@/depot/depot'
import { creerStockage } from '@/stockage/index'
import { Studio } from './composants/Studio'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const stockage = creerStockage()
  const depot = await lireDepot(stockage)

  const entrees = [...depot.entrees].sort(
    (a, b) => a.ordre - b.ordre || a.id.localeCompare(b.id),
  )
  const themes = [...depot.themes].sort((a, b) => a.ordre - b.ordre)
  const derniere = depot.publications.map((p) => p.version).sort((a, b) => b - a)[0] ?? null

  return (
    <Studio
      entrees={entrees}
      themes={themes}
      derniereVersion={derniere}
      // Les médias sont servis par la route /medias en local, et directement
      // par le stockage en production.
      urlBase={process.env.STUDIO_URL_MEDIAS ?? '/medias/'}
    />
  )
}
