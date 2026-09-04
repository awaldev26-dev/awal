'use client'

import { useState } from 'react'
import { lancerPublication } from '../actions'
import type { ResultatPublication } from '@/publication/publier'

export function BarreHaut({
  enregistrees,
  total,
  derniereVersion,
  onPublie,
}: {
  enregistrees: number
  total: number
  derniereVersion: number | null
  onPublie: () => void
}) {
  const [resultat, setResultat] = useState<ResultatPublication | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function publier() {
    setEnCours(true)
    const obtenu = await lancerPublication()
    setResultat(obtenu)
    setEnCours(false)
    if (obtenu.ok) onPublie()
  }

  const part = total > 0 ? Math.round((enregistrees / total) * 100) : 0

  return (
    <header className="relative flex h-barre shrink-0 items-center gap-bloc border-b border-bordure bg-surface px-bloc">
      <span className="font-semibold text-encre">Studio Awal</span>

      <div className="flex items-center gap-encart">
        <div
          className="h-1.5 w-40 overflow-hidden rounded-pilule bg-surface-creuse"
          role="progressbar"
          aria-valuenow={enregistrees}
          aria-valuemax={total}
        >
          <div className="h-full rounded-pilule bg-succes transition-all" style={{ width: `${part}%` }} />
        </div>
        <span className="text-sm text-encre-douce">
          <strong className="text-encre">{enregistrees}</strong> / {total} de ta voix
        </span>
      </div>

      <div className="ml-auto flex items-center gap-bloc">
        <span className="text-xs text-encre-faible">
          {derniereVersion ? `publié en v${derniereVersion}` : 'jamais publié'}
        </span>
        <button
          type="button"
          onClick={publier}
          disabled={enCours}
          className="rounded-champ bg-encre px-4 py-2 text-sm font-semibold text-white transition hover:bg-encre/90 disabled:opacity-50"
        >
          {enCours ? 'Publication…' : 'Publier le corpus'}
        </button>
      </div>

      {resultat ? (
        <div
          className={[
            'absolute top-barre right-bloc z-10 mt-2 max-w-md rounded-panneau border p-bloc text-sm shadow-flottant',
            resultat.ok
              ? 'border-succes/30 bg-succes-pale text-succes'
              : 'border-danger/30 bg-danger-pale text-danger',
          ].join(' ')}
        >
          <div className="flex items-start gap-encart">
            <div className="flex-1">
              {resultat.ok ? (
                <>Publié en v{resultat.version}. L’app le recevra à son prochain lancement.</>
              ) : (
                <>
                  <strong>{resultat.problemes.length} problème(s)</strong>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {resultat.problemes.slice(0, 6).map((probleme, index) => (
                      <li key={index}>{probleme.message}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setResultat(null)}
              aria-label="fermer"
              className="text-base leading-none opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
