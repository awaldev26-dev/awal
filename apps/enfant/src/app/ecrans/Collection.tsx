'use client'

import type { Artefact } from '@awal/corpus'
import { estAcquise } from '@/moteur/leitner.js'
import type { Progression } from '@/moteur/types.js'
import { emoji } from '@/jeux/emoji.js'

export function Collection({
  artefact, progression, onRetour,
}: {
  artefact: Artefact
  progression: Progression
  onRetour: () => void
}) {
  return (
    <main style={{ padding: 16, minHeight: '100dvh' }}>
      <button
        type="button"
        onClick={onRetour}
        aria-label="retour"
        style={{ fontSize: 20, padding: '8px 16px', borderRadius: 12, border: '3px solid #e6d9c6', background: '#fff' }}
      >
        ←
      </button>

      {artefact.themes.map((theme) => {
        const duTheme = artefact.entrees.filter((entree) => entree.themes.includes(theme.id))
        const acquises = duTheme.filter((entree) => {
          const etat = progression.etats[entree.id]
          return etat !== undefined && estAcquise(etat)
        })

        return (
          <section key={theme.id} style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20, color: theme.couleur }}>
              {theme.nom} — {acquises.length}/{duTheme.length}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {duTheme.map((entree) => {
                const etat = progression.etats[entree.id]
                const gagnee = etat !== undefined && estAcquise(etat)
                return (
                  <div
                    key={entree.id}
                    title={gagnee ? entree.kabyle : undefined}
                    style={{
                      width: 64, height: 64, borderRadius: 14, display: 'grid', placeItems: 'center',
                      fontSize: 32, background: gagnee ? '#fff' : '#eee3d2',
                      filter: gagnee ? 'none' : 'grayscale(1) opacity(0.35)',
                      border: `2px solid ${gagnee ? theme.couleur : '#e6d9c6'}`,
                    }}
                  >
                    {emoji(entree.picto)}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </main>
  )
}
