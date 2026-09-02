import type { Entree, Theme } from '@awal/corpus'
import { melanger } from '@/jeux/choisirDistracteurs.js'
import type { Progression } from './types.js'

export interface OptionsEntrainement {
  taille: number
  niveauMax: number
  /** Restreint à un thème. Absent, l'entraînement pioche partout. */
  theme?: string
}

/**
 * Compose un lot d'entraînement libre.
 *
 * Deux différences essentielles avec la session du jour :
 * — on ignore les dates de révision, puisque l'enjeu est justement de pouvoir
 *   rejouer quand on veut ;
 * — on ne propose **que** du vocabulaire déjà rencontré. La session du jour
 *   reste la seule porte d'entrée du vocabulaire nouveau, ce qui garde le
 *   plafond quotidien efficace.
 *
 * L'appelant ne doit pas enregistrer les résultats : faire monter les boîtes
 * ici détruirait la répétition espacée, un mot rejoué cinq fois de suite
 * passerait pour acquis sans avoir été mémorisé.
 */
export function composerEntrainement(
  entrees: Entree[],
  progression: Progression,
  options: OptionsEntrainement,
  alea: () => number = Math.random,
): Entree[] {
  const eligibles = entrees.filter(
    (entree) =>
      entree.niveau <= options.niveauMax &&
      progression.etats[entree.id] !== undefined &&
      (options.theme === undefined || entree.themes.includes(options.theme)),
  )

  return melanger(eligibles, alea).slice(0, options.taille)
}

export interface ThemeDisponible {
  theme: Theme
  nombre: number
}

/**
 * Thèmes dans lesquels l'enfant a déjà rencontré au moins un mot, avec leur
 * compte. Ceux qu'il n'a pas encore abordés ne sont pas affichés : proposer un
 * thème vide n'aboutirait qu'à un écran sans rien.
 */
export function themesDisponibles(
  entrees: Entree[],
  themes: Theme[],
  progression: Progression,
  niveauMax: number,
): ThemeDisponible[] {
  return themes
    .map((theme) => ({
      theme,
      nombre: entrees.filter(
        (entree) =>
          entree.themes.includes(theme.id) &&
          entree.niveau <= niveauMax &&
          progression.etats[entree.id] !== undefined,
      ).length,
    }))
    .filter((disponible) => disponible.nombre > 0)
}
