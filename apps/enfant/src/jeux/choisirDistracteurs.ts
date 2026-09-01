import type { Entree } from '@awal/corpus'

/** Mélange de Fisher-Yates, avec source d'aléa injectable pour les tests. */
export function melanger<T>(elements: T[], alea: () => number = Math.random): T[] {
  const copie = [...elements]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1))
    const a = copie[i]!
    const b = copie[j]!
    copie[i] = b
    copie[j] = a
  }
  return copie
}

/**
 * Tire des distracteurs, en priorité dans le thème de la cible.
 * Quatre images sans rapport rendraient la bonne réponse devinable sans écouter,
 * ce qui viderait l'exercice de son intérêt.
 */
export function choisirDistracteurs(
  cible: Entree,
  candidats: Entree[],
  nombre: number,
  alea: () => number = Math.random,
): Entree[] {
  const autres = candidats.filter((entree) => entree.id !== cible.id)
  const memeTheme = autres.filter((entree) =>
    entree.themes.some((theme) => cible.themes.includes(theme)),
  )
  const reste = autres.filter((entree) => !memeTheme.includes(entree))

  return [...melanger(memeTheme, alea), ...melanger(reste, alea)].slice(0, nombre)
}
