import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { entrees, themes } from '../src/db/schema.js'
import { extraireCorpus } from './extraire.js'
import { COULEUR_PAR_THEME, PICTO_PAR_THEME, pictoPour } from './pictos.js'

const markdown = readFileSync(join(import.meta.dirname, '../../../docs/corpus-v1.md'), 'utf8')
const corpus = extraireCorpus(markdown)

await db
  .insert(themes)
  .values(
    corpus.themes.map((theme) => ({
      id: theme.id,
      nom: theme.nom,
      picto: `openmoji:${PICTO_PAR_THEME[theme.id] ?? '2753'}`,
      couleur: COULEUR_PAR_THEME[theme.id] ?? '#666666',
      ordre: theme.ordre,
    })),
  )
  .onConflictDoNothing()

await db
  .insert(entrees)
  .values(
    corpus.entrees.map((entree) => ({
      id: entree.id,
      type: entree.type,
      kabyle: entree.kabyle,
      contient: entree.contient,
      fr: entree.fr,
      picto: pictoPour(entree.id, entree.theme),
      themes: [entree.theme],
      notes: entree.notes,
      aValider: entree.aValider,
    })),
  )
  // Les pictos sont remis à jour, mais rien d'autre : le kabyle, le français
  // et les notes peuvent avoir été corrigés à la main dans le studio.
  .onConflictDoUpdate({
    target: entrees.id,
    set: { picto: sql`excluded.picto` },
  })

console.log(`${corpus.themes.length} thèmes, ${corpus.entrees.length} entrées insérés.`)
process.exit(0)
