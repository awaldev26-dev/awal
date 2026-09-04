import {
  validerMedias,
  validerStructure,
  type Artefact,
  type ProblemeValidation,
} from '@awal/corpus'
import { creerVerificateur } from '@/stockage/index'
import type { StockageMedias } from '@/stockage/types'

/** Fichier que l'app enfant interroge. Écrasé à chaque publication. */
export const CLE_ACTUEL = 'corpus/actuel.json'

export type ResultatPublication =
  | { ok: true; version: number; cle: string }
  | { ok: false; problemes: ProblemeValidation[] }

/**
 * Valide puis écrit. Les deux validations tournent avant toute écriture :
 * une publication partielle laisserait l'app enfant avec un corpus incohérent.
 */
export async function publierArtefact(
  artefact: Artefact,
  stockage: StockageMedias,
): Promise<ResultatPublication> {
  const problemes = [
    ...validerStructure(artefact),
    ...(await validerMedias(artefact, creerVerificateur(stockage))),
  ]
  if (problemes.length > 0) return { ok: false, problemes }

  const contenu = new TextEncoder().encode(JSON.stringify(artefact))
  const cle = `corpus/v${artefact.version}.json`
  await stockage.ecrire(cle, contenu, 'application/json')
  await stockage.ecrire(CLE_ACTUEL, contenu, 'application/json')

  return { ok: true, version: artefact.version, cle }
}
