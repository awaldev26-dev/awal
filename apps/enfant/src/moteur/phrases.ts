import type { Entree } from '@awal/corpus'
import type { Progression } from './types'

/**
 * Boîte à partir de laquelle un mot est considéré comme connu, donc utilisable
 * dans une phrase. La boîte 2 signifie « rencontré et réussi au moins une fois ».
 *
 * Le seuil d'acquisition (boîte 4) serait trop exigeant : une phrase de deux
 * mots attendrait plusieurs semaines et n'apparaîtrait presque jamais.
 */
export const BOITE_MOT_CONNU = 2

/**
 * Une phrase n'est proposée que lorsque les mots qu'elle emploie sont connus.
 *
 * Sans ce verrou, `etch aghroum` peut tomber avant `etch` et avant `aghroum` :
 * l'enfant entend une suite de sons dont il ne reconnaît aucun morceau, ce qui
 * est décourageant et n'apprend rien.
 */
export function phraseDebloquee(entree: Entree, progression: Progression): boolean {
  if (entree.type !== 'phrase') return true
  return entree.contient.every((id) => (progression.etats[id]?.boite ?? 0) >= BOITE_MOT_CONNU)
}
