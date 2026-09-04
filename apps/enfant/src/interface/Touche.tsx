'use client'

import type { ReactNode } from 'react'

type Ton = 'accent' | 'safran' | 'calme'

const TONS: Record<Ton, string> = {
  // L'ombre portée est de la même famille que le fond, en plus sombre : c'est
  // ce qui donne l'impression d'un bouton bombé qu'on enfonce.
  accent: 'bg-accent text-white shadow-relief-accent active:shadow-none',
  safran: 'bg-accent-vif text-encre shadow-relief-safran active:shadow-none',
  calme: 'bg-surface text-encre shadow-relief active:shadow-none',
}

/**
 * Bouton du jeu.
 *
 * Bombé, avec une ombre portée qui disparaît à l'appui et un léger enfoncement :
 * l'enfant voit que sa touche a été prise en compte, ce qui compte plus qu'un
 * message quand on ne lit pas encore.
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
        'rounded-touche font-medium transition-all duration-100',
        'active:translate-y-1.5 disabled:opacity-45 disabled:shadow-none',
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
