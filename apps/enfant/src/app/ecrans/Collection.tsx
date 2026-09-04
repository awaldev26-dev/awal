'use client'

import type { Artefact } from '@awal/corpus'
import { estAcquise } from '@/moteur/leitner.js'
import type { Progression } from '@/moteur/types.js'
import { Picto } from '@/jeux/Picto.js'

export function Collection({
  artefact,
  progression,
  onRetour,
}: {
  artefact: Artefact
  progression: Progression
  onRetour: () => void
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-bloc pt-carte pb-large">
      <button
        type="button"
        onClick={onRetour}
        aria-label="retour"
        className="sticky top-carte z-10 grid size-12 place-items-center rounded-pilule bg-surface text-2xl shadow-relief transition active:translate-y-1 active:shadow-none"
      >
        ←
      </button>

      {artefact.themes.map((theme) => {
        const duTheme = artefact.entrees.filter((entree) => entree.themes.includes(theme.id))
        if (duTheme.length === 0) return null

        const acquises = duTheme.filter((entree) => {
          const etat = progression.etats[entree.id]
          return etat !== undefined && estAcquise(etat)
        })
        const part = Math.round((acquises.length / duTheme.length) * 100)

        return (
          <section key={theme.id} className="mt-large">
            <div className="mb-carte flex items-baseline gap-carte">
              <h2 className="font-mot text-xl" style={{ color: theme.couleur }}>
                {theme.nom}
              </h2>
              <span className="text-sm text-encre-douce">
                {acquises.length} / {duTheme.length}
              </span>
            </div>

            <div className="mb-carte h-2 overflow-hidden rounded-pilule bg-craie-creuse">
              <div
                className="h-full rounded-pilule transition-all"
                style={{ width: `${part}%`, background: theme.couleur }}
              />
            </div>

            <div
              className="grid gap-serre"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(3.75rem, 1fr))' }}
            >
              {duTheme.map((entree) => {
                const etat = progression.etats[entree.id]
                const gagnee = etat !== undefined && estAcquise(etat)
                return (
                  <div
                    key={entree.id}
                    title={gagnee ? entree.kabyle : undefined}
                    className={[
                      'grid aspect-square place-items-center rounded-carte transition',
                      gagnee
                        ? 'bg-surface shadow-relief'
                        : 'bg-craie-creuse/70 opacity-40 grayscale',
                    ].join(' ')}
                    style={gagnee ? { boxShadow: `0 4px 0 ${theme.couleur}55` } : undefined}
                  >
                    <Picto picto={entree.picto} artefact={artefact} taille="min(2rem, 7vw)" />
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
