/** État d'une entrée pour un profil donné. */
export interface EtatEntree {
  boite: number
  /** Jour calendaire de la prochaine révision, au format AAAA-MM-JJ. */
  prochaine: string
}

/** Ce qu'une activité renvoie au moteur, quelle que soit l'activité. */
export interface ResultatEntree {
  entreeId: string
  reussi: boolean
}

export interface Progression {
  etats: Record<string, EtatEntree>
  /** Nombre de mots nouveaux introduits, par jour calendaire. Sert au plafond. */
  nouveauxParJour: Record<string, number>
  /** Jours calendaires où une session a été terminée. Sert à la série. */
  joursJoues: string[]
}

export function progressionVide(): Progression {
  return { etats: {}, nouveauxParJour: {}, joursJoues: [] }
}
