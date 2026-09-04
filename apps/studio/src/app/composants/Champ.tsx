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

export const classesChamp =
  'w-full rounded-champ border border-bordure bg-surface px-3 py-2 text-sm ' +
  'text-encre transition placeholder:text-encre-faible ' +
  'focus:border-accent focus:outline-none'
