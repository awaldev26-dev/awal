'use client'

/**
 * Une lettre touchable.
 *
 * La majuscule occupe presque toute la tuile : à trois ans, c'est la forme
 * qu'on apprend à reconnaître, et rien ne doit la concurrencer. D'où l'absence
 * de tout autre contenu.
 */
export function Lettre({
  glyphe,
  couleur,
  taille = 'var(--spacing-lettre)',
  police,
  etat = 'repos',
  onClick,
}: {
  glyphe: string
  couleur: string
  taille?: string
  /** Taille du glyphe. À fournir quand `taille` est relative, un pourcentage
   *  de police se rapportant à la police du parent et non à la largeur. */
  police?: string
  etat?: 'repos' | 'dit' | 'refuse' | 'reussi'
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`lettre ${glyphe}`}
      className={[
        'grid place-items-center rounded-lettre bg-surface font-bold',
        'transition-transform duration-100 active:scale-[0.96]',
        etat === 'dit' ? 'animate-rebond' : '',
        etat === 'refuse' ? 'animate-refus' : '',
        etat === 'reussi' ? 'animate-rebond' : '',
      ].join(' ')}
      style={{
        width: taille,
        height: taille === '100%' ? 'auto' : taille,
        aspectRatio: taille === '100%' ? '1' : undefined,
        // La couleur du glyphe et l'aura viennent de la même teinte : c'est
        // elle qui distingue une tuile de sa voisine, sans contour net.
        color: couleur,
        fontSize: police ?? `calc(${taille} * 0.62)`,
        lineHeight: 1,
        boxShadow:
          etat === 'reussi' ? `0 0 34px 10px ${couleur}88` : `0 0 20px 4px ${couleur}40`,
      }}
    >
      {glyphe}
    </button>
  )
}
