'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Entree } from '@awal/corpus'
import { urlAudio } from '@/corpus/charger.js'
import type { ResultatEntree } from '@/moteur/types.js'
import { choisirDistracteurs, melanger } from './choisirDistracteurs.js'
import { Picto } from './Picto.js'
import type { ProprietesJeu } from './types.js'

export function EcouteEtChoisis({ lot, artefact, lecteur, onTermine }: ProprietesJeu) {
  const [index, setIndex] = useState(0)
  const [resultats, setResultats] = useState<ResultatEntree[]>([])
  const [ecartees, setEcartees] = useState<string[]>([])
  const [rate, setRate] = useState(false)
  const [trouvee, setTrouvee] = useState<string | null>(null)

  const cible = lot[index]

  const choix = useMemo(() => {
    if (!cible) return []
    return melanger([cible, ...choisirDistracteurs(cible, artefact.entrees, 3)])
  }, [cible, artefact])

  useEffect(() => {
    if (cible) void lecteur.jouer(urlAudio(artefact, cible))
    setEcartees([])
    setRate(false)
    setTrouvee(null)
  }, [cible, artefact, lecteur])

  if (!cible) return null

  function repondre(entree: Entree) {
    if (!cible || trouvee) return

    if (entree.id === cible.id) {
      setTrouvee(entree.id)
      const suivants = [...resultats, { entreeId: cible.id, reussi: !rate }]
      setResultats(suivants)
      // Une courte pause pour que l'enfant voie sa réussite avant l'écran suivant.
      setTimeout(() => {
        if (index + 1 >= lot.length) onTermine(suivants)
        else setIndex(index + 1)
      }, 620)
      return
    }

    // L'erreur ne punit pas : on écarte le mauvais choix, on rejoue le son,
    // et on laisse réessayer sans le moindre signal négatif.
    setRate(true)
    setEcartees((precedentes) => [...precedentes, entree.id])
    void lecteur.jouer(urlAudio(artefact, cible))
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-large px-bloc py-bloc">
      {/* Barre de progression sans chiffre : elle situe sans mettre la pression. */}
      <div className="flex w-full max-w-xs gap-1" aria-hidden>
        {lot.map((_, rang) => (
          <span
            key={rang}
            className={[
              'h-2 flex-1 rounded-pilule transition-colors',
              rang < index ? 'bg-joie' : rang === index ? 'bg-accent-vif' : 'bg-craie-creuse',
            ].join(' ')}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => lecteur.jouer(urlAudio(artefact, cible))}
        aria-label="réécouter"
        className="grid size-24 place-items-center rounded-pilule bg-accent-vif text-5xl shadow-relief-safran transition-all duration-100 active:translate-y-1.5 active:shadow-none"
      >
        🔊
      </button>

      <div
        className="grid w-full gap-carte"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(9rem, 42vw), 1fr))' }}
      >
        {choix.map((entree) => {
          const ecartee = ecartees.includes(entree.id)
          const gagnante = trouvee === entree.id
          return (
            <button
              key={entree.id}
              type="button"
              onClick={() => repondre(entree)}
              disabled={ecartee || trouvee !== null}
              aria-label={entree.fr}
              className={[
                'grid aspect-square place-items-center rounded-touche transition-all duration-150',
                'active:translate-y-1.5 active:shadow-none',
                gagnante
                  ? 'animate-rebond bg-joie/15 ring-4 ring-joie shadow-none'
                  : ecartee
                    ? 'bg-craie-creuse/60 opacity-35 shadow-none'
                    : 'bg-surface shadow-relief',
              ].join(' ')}
            >
              <Picto picto={entree.picto} artefact={artefact} taille="min(5.25rem, 24vw)" />
            </button>
          )
        })}
      </div>
    </main>
  )
}
