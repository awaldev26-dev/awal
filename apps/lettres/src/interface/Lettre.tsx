'use client'

import { Eclat } from './Eclat'

/** Ce que la tuile est en train de vivre. */
export type EtatLettre = 'endormie' | 'repos' | 'dit' | 'ecartee' | 'reussi'

/**
 * Une lettre touchable.
 *
 * La majuscule occupe presque toute la tuile : à trois ans, c'est la forme
 * qu'on apprend à reconnaître, et rien ne doit la concurrencer. D'où l'absence
 * de tout autre contenu.
 *
 * Cinq états, et trois portent tout le retour de l'exercice :
 *
 * — `endormie` : on n'a pas encore écouté la lettre à trouver. La tuile est
 *   bien là, mais estompée, grise et sans halo, et elle ne répond pas.
 *   Chercher avant d'entendre ne serait que deviner ; et cet état donne son
 *   rôle à l'oreille sans qu'on ait à l'écrire, puisqu'elle fait éclore les
 *   lettres en couleur et en pleine lumière.
 * — `ecartee` : touchée à tort. Estompée et hors jeu, mais toujours à sa place,
 *   car retirer une tuile décalerait les autres et ferait taper à côté.
 *   Aucune couleur d'alerte, aucune croix : à trois ans, une erreur ne se
 *   sanctionne pas, elle se retire du chemin.
 * — `reussi` : la bonne. Elle bondit au-delà de sa taille avant de se poser,
 *   une onde s'en échappe et un éclat en jaillit. Le contour net d'avant
 *   ressemblait à un champ de formulaire, et les grains figés ne fêtaient
 *   rien : c'est le mouvement qui célèbre.
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
  const endormie = etat === 'endormie'
  const inerte = ecartee || endormie

  return (
    <button
      type="button"
      onClick={onClick}
      // Hors jeu : plus aucun appui ne doit compter, ni au doigt ni au clavier.
      disabled={inerte}
      aria-label={`lettre ${glyphe}`}
      className={[
        // `relative` et `overflow-visible` : l'éclat déborde volontairement de
        // la tuile, sinon il serait rogné à ses bords.
        'relative grid place-items-center overflow-visible rounded-lettre font-bold',
        'transition-all duration-200',
        'bg-surface',
        inerte ? '' : 'active:scale-[0.96]',
        etat === 'dit' ? 'animate-rebond' : '',
        reussi ? 'animate-triomphe z-10' : '',
      ].join(' ')}
      style={{
        width: taille,
        height: taille === '100%' ? 'auto' : taille,
        aspectRatio: taille === '100%' ? '1' : undefined,
        // La couleur du glyphe et l'aura viennent de la même teinte : c'est
        // elle qui distingue une tuile de sa voisine, sans contour net.
        // Grise avant l'écoute : la couleur est une récompense de l'oreille.
        color: endormie ? 'var(--color-encre-douce)' : couleur,
        fontSize: police ?? `calc(${taille} * 0.62)`,
        lineHeight: 1,
        /*
         * Estompée sans disparaître, dans les deux cas où la tuile ne répond
         * pas : elle reste lisible, donc elle continue d'apprendre la forme,
         * mais elle ne sollicite plus. Un peu plus pâle une fois écartée
         * qu'endormie, car écartée l'est définitivement — et les deux états ne
         * se côtoient jamais, l'un précédant l'écoute et l'autre la suivant.
         */
        opacity: ecartee ? 0.4 : endormie ? 0.5 : 1,
        boxShadow: ecartee
          ? 'none'
          : endormie
            ? 'var(--shadow-halo)'
            : reussi
              ? `0 0 48px 16px ${couleur}aa`
              : `0 0 20px 4px ${couleur}40`,
      }}
    >
      {reussi ? <Eclat /> : null}
      {glyphe}
    </button>
  )
}
