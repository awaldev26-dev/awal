import type { Lettre } from './alphabet'

/**
 * Tire une question de « Trouve la lettre ».
 *
 * La cible est toujours parmi les propositions — sinon l'exercice serait
 * insoluble, ce qu'une enfant de trois ans ne pourrait ni comprendre ni
 * signaler.
 *
 * Les lettres sont tirées au hasard dans tout l'alphabet : faute de
 * persistance il n'y a pas de notion de « déjà vue », et à cet âge la
 * répétition n'est pas un défaut mais le mécanisme même de l'apprentissage.
 */
export interface Question {
  cible: Lettre
  propositions: Lettre[]
}

/**
 * Mélange une copie, sans toucher à l'original.
 *
 * Fisher-Yates plutôt qu'un tri sur une comparaison aléatoire : ce dernier
 * produit des distributions nettement biaisées, et on ne veut pas que les
 * mêmes lettres reviennent toujours aux mêmes places.
 */
function melanger<T>(liste: readonly T[]): T[] {
  const copie = [...liste]
  for (let i = copie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tampon = copie[i] as T
    copie[i] = copie[j] as T
    copie[j] = tampon
  }
  return copie
}

/**
 * Compose une question à `nombre` propositions.
 *
 * Si l'alphabet est plus petit que le nombre demandé, on rend simplement tout
 * ce qu'on a : mieux vaut une question à deux choix qu'une boucle qui cherche
 * indéfiniment une troisième lettre inexistante.
 */
export function tirerQuestion(alphabet: readonly Lettre[], nombre: number): Question | null {
  if (alphabet.length === 0 || nombre < 1) return null

  const propositions = melanger(alphabet).slice(0, Math.min(nombre, alphabet.length))
  const cible = propositions[Math.floor(Math.random() * propositions.length)] as Lettre

  return { cible, propositions }
}
