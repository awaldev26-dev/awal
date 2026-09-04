'use client'

import type { ReactNode } from 'react'

type Ton = 'accent' | 'safran' | 'calme'

const TONS: Record<Ton, string> = {
  // Aplats colorés, détachés du fond par un halo diffus plutôt que par un
  // relief simulé.
  accent: 'bg-accent text-white shadow-halo-fort',
  safran: 'bg-accent-vif text-encre shadow-halo-fort',
  calme: 'bg-surface text-encre shadow-halo',
}

/**
 * Bouton du jeu.
 *
 * Aplat franc, sans relief simulé. Le retour à l'appui est un léger
 * rétrécissement : un enfant qui ne lit pas encore voit ainsi que sa touche a
 * compté, sans qu'on ait besoin de lui écrire quoi que ce soit.
 */
export function Touche({
  ton = 'accent',
  taille = 'normale',
  children,
  className = '',
  ...reste
}: {
  ton?: Ton
  taille?: 'normale' | 'grande'
  children: ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={[
        'rounded-touche font-medium transition-transform duration-100',
        'active:scale-[0.97] disabled:opacity-45',
        taille === 'grande' ? 'px-8 py-5 text-2xl' : 'px-6 py-3.5 text-lg',
        TONS[ton],
        className,
      ].join(' ')}
      {...reste}
    >
      {children}
    </button>
  )
}
