'use client'

import type { Artefact, Entree } from '@awal/corpus'
import { Confettis } from '@/interface/Confettis.js'
import { Touche } from '@/interface/Touche.js'
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
  const gagne = acquises.length > 0
  const pluriel = acquises.length > 1 ? 's' : ''

  return (
    <main className="relative mx-auto grid min-h-dvh w-full max-w-2xl content-center justify-items-center gap-large px-bloc py-large">
      {/* Les confettis ne tombent que s'il y a vraiment quelque chose à fêter :
          en tomber à chaque fois les viderait de leur sens. */}
      <Confettis actif={gagne} />

      <p className="animate-apparition text-center text-3xl leading-tight text-encre">
        {gagne ? (
          <>
            <span className="block text-5xl">⭐</span>
            {acquises.length} nouvelle{pluriel} carte{pluriel}
          </>
        ) : (
          <>
            <span className="block text-5xl">👏</span>
            Bien joué&nbsp;!
          </>
        )}
      </p>

      {gagne ? (
        <div className="flex flex-wrap justify-center gap-carte">
          {acquises.slice(0, 5).map((entree, rang) => (
            <span
              key={entree.id}
              className="animate-apparition grid w-pastille place-items-center rounded-carte bg-surface py-3 shadow-relief"
              style={{ animationDelay: `${rang * 90}ms` }}
            >
              <Picto picto={entree.picto} artefact={artefact} taille="2.5rem" />
            </span>
          ))}
        </div>
      ) : null}

      <p className="font-mot text-xl text-encre-douce">Ar toufath&nbsp;!</p>

      <Touche ton="accent" taille="grande" onClick={onContinuer}>
        Continuer
      </Touche>
    </main>
  )
}
