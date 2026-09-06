'use client'

import { useEffect, useState } from 'react'

/** Teintes de la fête. Puisées dans la palette, jamais écrites en dur ailleurs. */
const TEINTES = [
  'var(--color-bleu)',
  'var(--color-framboise)',
  'var(--color-mandarine)',
  'var(--color-menthe)',
  'var(--color-mure)',
]

const NOMBRE = 14

/**
 * Petite fête après une bonne réponse.
 *
 * Purement décorative et sans son : la joie passe par l'image, la voix étant
 * déjà occupée à prononcer la lettre.
 */
export function Fete({ actif }: { actif: boolean }) {
  const [graine, setGraine] = useState(0)

  useEffect(() => {
    if (actif) setGraine((valeur) => valeur + 1)
  }, [actif])

  if (!actif) return null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: NOMBRE }, (_, i) => {
        // Positions déduites de l'index plutôt que tirées au hasard : le rendu
        // reste identique entre le serveur et le client, ce qu'exige l'export
        // statique.
        const gauche = ((i * 37) % 100) + (graine % 3)
        const retard = (i % 5) * 0.06
        return (
          <span
            key={`${graine}-${i}`}
            className="absolute animate-eclot rounded-pilule"
            style={{
              left: `${gauche}%`,
              top: `${((i * 23) % 70) + 10}%`,
              width: '0.9rem',
              height: '0.9rem',
              background: TEINTES[i % TEINTES.length],
              animationDelay: `${retard}s`,
            }}
          />
        )
      })}
    </div>
  )
}
