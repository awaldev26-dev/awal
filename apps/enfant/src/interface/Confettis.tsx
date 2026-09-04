'use client'

import { useEffect, useState } from 'react'

const COULEURS = [
  'var(--color-safran)',
  'var(--color-terracotta)',
  'var(--color-indigo)',
  'var(--color-olive)',
  'var(--color-prune)',
]

interface Grain {
  cle: number
  gauche: number
  delai: number
  duree: number
  couleur: string
  taille: number
}

/**
 * Pluie de confettis, pour célébrer une carte gagnée.
 *
 * Purement décoratif et non bloquant : les grains tombent par-dessus l'écran
 * sans intercepter les touches, et disparaissent seuls. Rien n'attend qu'ils
 * finissent.
 */
export function Confettis({ nombre = 40, actif = true }: { nombre?: number; actif?: boolean }) {
  const [grains, setGrains] = useState<Grain[]>([])

  useEffect(() => {
    if (!actif) return
    // Tiré au montage seulement : régénérer à chaque rendu ferait scintiller.
    setGrains(
      Array.from({ length: nombre }, (_, index) => ({
        cle: index,
        gauche: Math.random() * 100,
        delai: Math.random() * 0.6,
        duree: 1.8 + Math.random() * 1.4,
        couleur: COULEURS[index % COULEURS.length] ?? COULEURS[0]!,
        taille: 8 + Math.random() * 8,
      })),
    )
  }, [nombre, actif])

  if (!actif) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {grains.map((grain) => (
        <span
          key={grain.cle}
          className="absolute top-0 block rounded-[30%]"
          style={{
            left: `${grain.gauche}%`,
            width: grain.taille,
            height: grain.taille * 0.6,
            background: grain.couleur,
            animation: `tombe ${grain.duree}s linear ${grain.delai}s forwards`,
          }}
        />
      ))}
    </div>
  )
}
