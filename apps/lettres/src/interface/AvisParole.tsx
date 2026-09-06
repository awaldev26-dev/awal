'use client'

import { useEffect, useState } from 'react'
import { estBloque, surBlocage } from '@/parole'

/**
 * Avertit le parent quand le son est bloqué.
 *
 * Le moteur de parole de Chrome se coince parfois pour toute la session du
 * navigateur : l'état vit dans son service de parole, pas dans le document,
 * si bien que recharger la page n'y change rien. Rien ne peut le débloquer
 * depuis ici.
 *
 * Le message s'adresse donc à l'adulte, puisqu'une enfant de trois ans ne
 * pourra ni lire, ni comprendre, ni signaler un silence.
 */
export function AvisParole() {
  const [bloque, setBloque] = useState(false)

  useEffect(() => {
    setBloque(estBloque())
    return surBlocage(() => setBloque(true))
  }, [])

  if (!bloque) return null

  return (
    <p
      role="alert"
      className="fixed inset-x-bloc bottom-bloc z-10 rounded-touche bg-attention px-bloc py-carte text-center text-sm text-white shadow-halo-fort"
    >
      Le son est bloqué par le navigateur. Quitte-le complètement, puis
      relance-le.
    </p>
  )
}
