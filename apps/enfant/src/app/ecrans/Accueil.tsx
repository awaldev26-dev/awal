'use client'

import { Touche } from '@/interface/Touche.js'
import type { Profil } from '@/stockage/magasin.js'

export function Accueil({
  profil,
  serie,
  aFaire,
  onDemarrer,
  onEntrainement,
  onCollection,
  onChangerProfil,
}: {
  profil: Profil
  serie: number
  aFaire: number
  onDemarrer: () => void
  onEntrainement: () => void
  onCollection: () => void
  onChangerProfil: () => void
}) {
  const fini = aFaire === 0

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-bloc py-bloc">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onChangerProfil}
          aria-label="changer de profil"
          className="grid size-14 place-items-center rounded-pilule bg-surface text-3xl shadow-relief transition active:translate-y-1 active:shadow-none"
        >
          {profil.avatar}
        </button>

        {serie > 1 ? (
          <span className="flex items-center gap-1 rounded-pilule bg-safran-clair px-4 py-2 text-lg text-encre">
            🔥 {serie}
          </span>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-large py-large">
        <button
          type="button"
          onClick={onDemarrer}
          disabled={fini}
          className={[
            'grid w-touche place-items-center gap-1 rounded-touche py-large text-center',
            'transition-all duration-100 active:translate-y-1.5 active:shadow-none',
            fini
              ? 'bg-joie text-white shadow-relief'
              : 'animate-flotte bg-accent text-white shadow-relief-accent',
          ].join(' ')}
        >
          <span className="text-5xl leading-none">{fini ? '🎉' : '▶'}</span>
          <span className="px-2 text-xl leading-tight">
            {fini ? 'Session faite !' : 'Session du jour'}
          </span>
        </button>

        <div className="grid w-full gap-carte" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))' }}>
          <Touche ton="safran" onClick={onEntrainement}>
            🔊 Écouter les mots
          </Touche>
          <Touche ton="calme" onClick={onCollection}>
            ⭐ Ma collection
          </Touche>
        </div>
      </div>
    </main>
  )
}
