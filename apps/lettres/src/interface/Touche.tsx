'use client'

import type { ReactNode } from 'react'

type Ton = 'accent' | 'joie' | 'calme'

const TONS: Record<Ton, string> = {
  accent: 'bg-accent text-white shadow-halo-fort',
  joie: 'bg-joie text-white shadow-halo-fort',
  calme: 'bg-surface text-encre shadow-halo',
}

/**
 * Grosse touche.
 *
 * Le retour à l'appui est un rétrécissement : une enfant qui ne lit pas voit
 * ainsi que sa touche a compté, sans qu'on ait besoin de lui écrire quoi que
 * ce soit.
 */
export function Touche({
  ton = 'accent',
  children,
  className = '',
  ...reste
}: {
  ton?: Ton
  children: ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={[
        'rounded-touche px-large py-bloc text-2xl font-semibold',
        'transition-transform duration-100 active:scale-[0.96] disabled:opacity-45',
        TONS[ton],
        className,
      ].join(' ')}
      {...reste}
    >
      {children}
    </button>
  )
}
