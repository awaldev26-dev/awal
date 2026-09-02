import type { Entree, Theme } from '@awal/corpus'
import { melanger } from '@/jeux/choisirDistracteurs.js'
import { phraseDebloquee } from './phrases.js'
import type { Progression } from './types.js'

export interface OptionsEntrainement {
  taille: number
  niveauMax: number
  /** Restreint à un thème. Absent, l'entraînement pioche partout. */
  theme?: string
}

function dansLePerimetre(entree: Entree, options: OptionsEntrainement): boolean {
  return (
    entree.niveau <= options.niveauMax &&
    (options.theme === undefined || entree.themes.includes(options.theme))
  )
}

/**
 * Compose un lot d'entraînement libre.
 *
 * Deux différences essentielles avec la session du jour :
 * — on ignore les dates de révision, puisque l'enjeu est justement de pouvoir
 *   rejouer quand on veut ;
 * — rien n'est écrit dans la progression. L'appelant ne doit pas enregistrer
 *   les résultats : faire monter les boîtes ici détruirait la répétition
 *   espacée, un mot rejoué cinq fois de suite passerait pour acquis.
 *
 * Le vocabulaire déjà rencontré passe d'abord. À défaut, on se rabat sur les
 * entrées du niveau : le bouton « S'entraîner » est toujours actif, il ne doit
 * jamais mener à un écran où l'on ne peut rien faire. Les phrases restent
 * verrouillées dans ce repli — un débutant ne doit pas tomber sur une phrase
 * dont il ignore les mots.
 */
export function composerEntrainement(
  entrees: Entree[],
  progression: Progression,
  options: OptionsEntrainement,
  alea: () => number = Math.random,
): Entree[] {
  const perimetre = entrees.filter((entree) => dansLePerimetre(entree, options))

  const rencontrees = perimetre.filter((entree) => progression.etats[entree.id] !== undefined)
  const vivier = rencontrees.length > 0
    ? rencontrees
    : perimetre.filter((entree) => phraseDebloquee(entree, progression))

  return melanger(vivier, alea).slice(0, options.taille)
}

export interface ThemeDisponible {
  theme: Theme
  /** Entrées du thème déjà rencontrées. Peut valoir zéro : le thème reste jouable. */
  nombre: number
}

/**
 * Thèmes proposés à l'entraînement, avec le nombre d'entrées déjà rencontrées.
 *
 * Les thèmes jamais abordés sont proposés : l'entraînement se rabat sur leur
 * vocabulaire, donc ils mènent à quelque chose. Un thème n'est écarté que s'il
 * ne mène à rien du tout — le cas concret étant celui des phrases, toutes
 * verrouillées tant que le vocabulaire n'est pas installé : l'afficher
 * ouvrirait sur un écran vide.
 */
export function themesDisponibles(
  entrees: Entree[],
  themes: Theme[],
  progression: Progression,
  niveauMax: number,
): ThemeDisponible[] {
  return themes
    .map((theme) => {
      const duTheme = entrees.filter(
        (entree) => entree.themes.includes(theme.id) && entree.niveau <= niveauMax,
      )
      const rencontrees = duTheme.filter((entree) => progression.etats[entree.id] !== undefined)
      return {
        theme,
        // Ce que l'entraînement pourrait réellement servir dans ce thème.
        jouables: rencontrees.length > 0
          ? rencontrees.length
          : duTheme.filter((entree) => phraseDebloquee(entree, progression)).length,
        nombre: rencontrees.length,
      }
    })
    .filter((disponible) => disponible.jouables > 0)
    .map(({ theme, nombre }) => ({ theme, nombre }))
}
