'use client'

import type { ReactNode } from 'react'
import { useAwal } from './FournisseurAwal'

/**
 * Barrière commune aux routes qui ont besoin du corpus : elle évite que chaque
 * page réécrive le même trio « erreur / chargement / prêt ».
 */
export function Attente({ children }: { children: ReactNode }) {
  const { artefact, erreur } = useAwal()

  if (erreur) {
    return (
      <main style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 64 }}>📡</p>
        <p>Le corpus n’a pas pu être chargé.</p>
        <p style={{ opacity: 0.6, fontSize: 13 }}>{erreur}</p>
      </main>
    )
  }

  if (!artefact) {
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', fontSize: 64 }}>
        ⏳
      </main>
    )
  }

  return <>{children}</>
}
