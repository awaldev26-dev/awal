'use client'

/** Ce que la tuile est en train de vivre. */
export type EtatLettre = 'repos' | 'dit' | 'ecartee' | 'reussi'

/**
 * Une lettre touchable.
 *
 * La majuscule occupe presque toute la tuile : à trois ans, c'est la forme
 * qu'on apprend à reconnaître, et rien ne doit la concurrencer. D'où l'absence
 * de tout autre contenu.
 *
 * Quatre états, et deux d'entre eux portent tout le retour de l'exercice :
 *
 * — `ecartee` : touchée à tort. Estompée et hors jeu, mais toujours à sa place,
 *   car retirer une tuile décalerait les autres et ferait taper à côté.
 *   Aucune couleur d'alerte, aucune croix : à trois ans, une erreur ne se
 *   sanctionne pas, elle se retire du chemin.
 * — `reussi` : la bonne. Elle grandit, s'entoure d'un anneau et d'un halo
 *   franc — c'est la seule chose qui doit attirer l'œil à cet instant.
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
  etat?: EtatLettre
  onClick?: () => void
}) {
  const ecartee = etat === 'ecartee'
  const reussi = etat === 'reussi'

  return (
    <button
      type="button"
      onClick={onClick}
      // Hors jeu : plus aucun appui ne doit compter, ni au doigt ni au clavier.
      disabled={ecartee}
      aria-label={`lettre ${glyphe}`}
      className={[
        'grid place-items-center rounded-lettre font-bold',
        'transition-all duration-200',
        ecartee ? 'bg-lait-creuse' : 'bg-surface active:scale-[0.96]',
        etat === 'dit' ? 'animate-rebond' : '',
        reussi ? 'animate-rebond' : '',
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
        // Estompée sans disparaître : elle reste lisible, donc elle continue
        // d'apprendre la forme, mais elle ne sollicite plus.
        opacity: ecartee ? 0.28 : 1,
        transform: reussi ? 'scale(1.06)' : undefined,
        outline: reussi ? `4px solid ${couleur}` : undefined,
        outlineOffset: reussi ? '3px' : undefined,
        boxShadow: ecartee
          ? 'none'
          : reussi
            ? `0 0 40px 12px ${couleur}99`
            : `0 0 20px 4px ${couleur}40`,
      }}
    >
      {glyphe}
    </button>
  )
}
