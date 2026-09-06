import type { ReactNode } from 'react'

/**
 * Un champ de formulaire. Existe pour que l'étiquette, l'espacement et la
 * bordure ne soient décrits qu'une fois — sinon chaque champ dérive.
 */
export function Champ({
  etiquette,
  aide,
  children,
}: {
  etiquette: string
  aide?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium tracking-wide text-encre-douce uppercase">
        {etiquette}
      </span>
      {children}
      {aide ? <span className="mt-1 block text-xs text-encre-faible">{aide}</span> : null}
    </label>
  )
}

/**
 * Classes communes aux champs de saisie.
 *
 * La police fait 16 px sur petit écran, 14 px seulement à partir de md.
 * Ce n'est pas un choix esthétique : Safari sur iOS zoome de lui-même dès
 * qu'on touche un champ dont la police est plus petite que 16 px, et la page
 * se met alors à défiler horizontalement sans qu'on puisse y revenir. Élargir
 * la police est le seul remède acceptable — désactiver le zoom du navigateur
 * réglerait le symptôme en privant de zoom ceux qui en ont besoin pour lire.
 */
export const classesChamp =
  'w-full rounded-champ border border-bordure bg-surface px-3 py-2 ' +
  'text-base md:text-sm ' +
  'text-encre transition placeholder:text-encre-faible ' +
  'focus:border-accent focus:outline-none'
