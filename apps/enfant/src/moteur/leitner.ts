import type { EtatEntree } from './types'

export const NB_BOITES = 5

/** À partir de cette boîte, la carte apparaît en couleur dans la collection. */
export const BOITE_ACQUISE = 4

export const DELAIS_JOURS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 }

/**
 * Réduit une date à son jour calendaire UTC.
 * Les délais se comptent en jours, pas en heures : jouer à 8 h puis à 19 h
 * ne doit pas ramener la même carte, et jouer à 23 h 55 doit rendre
 * les révisions du lendemain disponibles dès le matin.
 */
export function jour(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function ajouterJours(date: Date, nombre: number): string {
  const copie = new Date(date.getTime())
  copie.setUTCDate(copie.getUTCDate() + nombre)
  return jour(copie)
}

export function nouvelEtat(maintenant: Date): EtatEntree {
  return { boite: 1, prochaine: jour(maintenant) }
}

export function apresReponse(etat: EtatEntree, reussi: boolean, maintenant: Date): EtatEntree {
  const boite = reussi ? Math.min(etat.boite + 1, NB_BOITES) : 1
  return { boite, prochaine: ajouterJours(maintenant, DELAIS_JOURS[boite] ?? 1) }
}

export function estDue(etat: EtatEntree, maintenant: Date): boolean {
  return etat.prochaine <= jour(maintenant)
}

export function estAcquise(etat: EtatEntree): boolean {
  return etat.boite >= BOITE_ACQUISE
}
