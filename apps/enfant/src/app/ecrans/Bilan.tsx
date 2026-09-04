'use client'

import type { Artefact, Entree } from '@awal/corpus'
import { Picto } from '@/jeux/Picto.js'

export function Bilan({
  acquises,
  artefact,
  onContinuer,
}: {
  acquises: Entree[]
  artefact: Artefact
  onContinuer: () => void
}) {
  const pluriel = acquises.length > 1 ? 's' : ''
  return (
    <main style={{ display: 'grid', gap: 28, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <p style={{ fontSize: 26 }}>
        {acquises.length > 0 ? `★ ${acquises.length} nouvelle${pluriel} carte${pluriel}` : 'Bien joué !'}
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        {acquises.slice(0, 5).map((entree) => (
          <Picto key={entree.id} picto={entree.picto} artefact={artefact} taille="3.5rem" />
        ))}
      </div>
      <p style={{ fontSize: 22, opacity: 0.7 }}>Ar toufath !</p>
      <button
        type="button"
        onClick={onContinuer}
        style={{ fontSize: 22, padding: '14px 40px', borderRadius: 16, border: 'none', background: '#c94f3d', color: '#fff' }}
      >
        OK
      </button>
    </main>
  )
}
