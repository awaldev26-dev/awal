/**
 * Couleur attribuée à une lettre.
 *
 * Cinq teintes cyclées sur l'alphabet : deux lettres voisines n'ont jamais la
 * même, ce qui aide à les distinguer dans la grille sans ajouter de contour.
 *
 * Déterministe, et non tirée au hasard : une lettre doit garder sa couleur
 * d'une visite à l'autre, sinon elle perd son repère.
 */
const TEINTES = [
  'var(--color-bleu)',
  'var(--color-framboise)',
  'var(--color-mandarine)',
  'var(--color-menthe)',
  'var(--color-mure)',
]

export function couleurDe(glyphe: string): string {
  const rang = glyphe.charCodeAt(0) - 65
  return TEINTES[((rang % TEINTES.length) + TEINTES.length) % TEINTES.length] as string
}
