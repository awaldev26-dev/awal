import type { Entree } from '@awal/corpus'
import { apresReponse, estDue, jour, nouvelEtat } from './leitner.js'
import type { Progression, ResultatEntree } from './types.js'

export interface OptionsSession {
  /** Nombre maximal d'entrées dans une session. Vise 5 à 8 minutes de jeu. */
  taille: number
  /** Nombre maximal de mots nouveaux introduits dans une journée. */
  plafondNouveaux: number
  /** Niveau le plus élevé accessible au profil. */
  niveauMax: number
}

export function OPTIONS_PAR_AGE(age: number): OptionsSession {
  return age <= 7
    ? { taille: 10, plafondNouveaux: 5, niveauMax: 1 }
    : { taille: 12, plafondNouveaux: 8, niveauMax: 3 }
}

/**
 * Compose la session du jour : les révisions dues d'abord, complétées par des
 * nouveautés dans la limite du plafond quotidien.
 *
 * Les révisions passent avant les nouveautés parce qu'une carte oubliée coûte
 * plus cher que retarder d'un jour une découverte — et parce que c'est ce qui
 * empêche la dette de révision d'enfler indéfiniment : quand les révisions
 * saturent la session, aucune nouveauté n'est introduite ce jour-là.
 */
export function composerSession(
  entrees: Entree[],
  progression: Progression,
  options: OptionsSession,
  maintenant: Date,
): Entree[] {
  const eligibles = entrees.filter((entree) => entree.niveau <= options.niveauMax)

  const revisions = eligibles.filter((entree) => {
    const etat = progression.etats[entree.id]
    return etat !== undefined && estDue(etat, maintenant)
  })

  const dejaIntroduits = progression.nouveauxParJour[jour(maintenant)] ?? 0
  const placesNouveautes = Math.min(
    Math.max(0, options.plafondNouveaux - dejaIntroduits),
    Math.max(0, options.taille - revisions.length),
  )

  const nouveautes = eligibles
    .filter((entree) => progression.etats[entree.id] === undefined)
    .slice(0, placesNouveautes)

  return [...revisions, ...nouveautes].slice(0, options.taille)
}

/**
 * Applique les résultats d'une activité. Ne modifie pas la progression reçue :
 * l'appelant remplace la sienne par la valeur renvoyée.
 */
export function appliquerResultats(
  progression: Progression,
  resultats: ResultatEntree[],
  maintenant: Date,
): Progression {
  const aujourdhui = jour(maintenant)
  const etats = { ...progression.etats }
  const nouveauxParJour = { ...progression.nouveauxParJour }
  let nouveaux = nouveauxParJour[aujourdhui] ?? 0

  for (const resultat of resultats) {
    const existant = etats[resultat.entreeId]
    if (existant === undefined) nouveaux += 1
    const depart = existant ?? nouvelEtat(maintenant)
    etats[resultat.entreeId] = apresReponse(depart, resultat.reussi, maintenant)
  }

  nouveauxParJour[aujourdhui] = nouveaux
  const joursJoues = progression.joursJoues.includes(aujourdhui)
    ? progression.joursJoues
    : [...progression.joursJoues, aujourdhui]

  return { etats, nouveauxParJour, joursJoues }
}

/**
 * Longueur de la série en cours. Un jour manqué est toléré ; deux la remettent
 * à zéro. Perdre trente jours pour une soirée chez les grands-parents serait absurde.
 */
export function serie(progression: Progression, maintenant: Date): number {
  const joues = new Set(progression.joursJoues)
  let longueur = 0
  let manques = 0
  const curseur = new Date(maintenant.getTime())

  for (let i = 0; i < 400; i++) {
    if (joues.has(jour(curseur))) {
      longueur += 1
      manques = 0
    } else if (i > 0) {
      manques += 1
      if (manques >= 2) break
    }
    curseur.setUTCDate(curseur.getUTCDate() - 1)
  }

  return longueur
}
