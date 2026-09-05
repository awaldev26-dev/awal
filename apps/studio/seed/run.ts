/**
 * Construit la source du corpus depuis docs/corpus-v1.md.
 *
 * Écrit corpus/source.json dans le stockage. Relancer le script met à jour les
 * pictos et l'ordre mais préserve tout le reste : le kabyle, le français et les
 * notes peuvent avoir été corrigés à la main dans le studio, et les
 * enregistrements ne doivent surtout pas être perdus.
 *
 *   pnpm seed
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { lireDepot, ecrireDepot } from '../src/depot/depot'
import type { Depot, EntreeSource, ThemeSource } from '../src/depot/types'
import { creerStockage } from '../src/stockage/index'
import { extraireCorpus } from './extraire'
import { COULEUR_PAR_THEME, PICTO_PAR_THEME, pictoPour } from './pictos'

const markdown = readFileSync(join(import.meta.dirname, '../../../docs/corpus-v1.md'), 'utf8')
const corpus = extraireCorpus(markdown)

const stockage = creerStockage()
const existant = await lireDepot(stockage)
const parId = new Map(existant.entrees.map((entree) => [entree.id, entree]))

const themes: ThemeSource[] = corpus.themes.map((theme) => ({
  id: theme.id,
  nom: theme.nom,
  picto: `openmoji:${PICTO_PAR_THEME[theme.id] ?? '2753'}`,
  couleur: COULEUR_PAR_THEME[theme.id] ?? '#666666',
  ordre: theme.ordre,
}))

const entrees: EntreeSource[] = corpus.entrees.map((entree) => {
  const deja = parId.get(entree.id)
  const picto = pictoPour(entree.id, entree.theme)

  // Une entrée déjà présente garde ce que le studio a pu modifier ; seuls
  // l'ordre et le picto par défaut sont rafraîchis.
  if (deja) {
    return { ...deja, ordre: entree.ordre, picto: deja.picto || picto }
  }

  return {
    id: entree.id,
    type: entree.type,
    kabyle: entree.kabyle,
    kabyleStd: null,
    fr: entree.fr,
    audio: null,
    variante: 'kabyle-nord',
    picto,
    themes: [entree.theme],
    niveau: 1,
    pluriel: null,
    contient: entree.contient,
    notes: entree.notes,
    aValider: entree.aValider,
    ordre: entree.ordre,
  }
})

const depot: Depot = { format: 1, themes, entrees, publications: existant.publications }
await ecrireDepot(stockage, depot)

const conserves = entrees.filter((entree) => entree.audio !== null).length
console.log(
  `${themes.length} thèmes, ${entrees.length} entrées écrites dans la source.` +
    (conserves > 0 ? ` ${conserves} enregistrement(s) conservé(s).` : ''),
)
process.exit(0)
