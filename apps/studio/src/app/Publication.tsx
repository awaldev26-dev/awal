'use client'

import { useState } from 'react'
import { lancerPublication } from './actions.js'
import type { ResultatPublication } from '@/publication/publier.js'

export function Publication() {
  const [resultat, setResultat] = useState<ResultatPublication | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function publier() {
    setEnCours(true)
    setResultat(await lancerPublication())
    setEnCours(false)
  }

  return (
    <section style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #ccc' }}>
      <button type="button" onClick={publier} disabled={enCours} style={{ padding: '8px 16px' }}>
        {enCours ? 'Publication…' : 'Publier le corpus'}
      </button>
      {resultat?.ok ? (
        <p style={{ color: '#1e7a3c' }}>Publié en v{resultat.version}.</p>
      ) : null}
      {resultat && !resultat.ok ? (
        <ul style={{ color: '#b0413e' }}>
          {resultat.problemes.map((probleme, index) => (
            <li key={index}>{probleme.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
