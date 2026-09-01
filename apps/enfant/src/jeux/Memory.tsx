'use client'

import { useEffect, useMemo, useState } from 'react'
import { urlAudio } from '@/corpus/charger.js'
import { melanger } from './choisirDistracteurs.js'
import { emoji } from './emoji.js'
import type { ProprietesJeu } from './types.js'

interface Carte {
  cle: string
  entreeId: string
  face: 'image' | 'son'
}

/** Memory à paires image ↔ son : retrouver le son qui va avec l'image. */
export function Memory({ lot, artefact, lecteur, onTermine }: ProprietesJeu) {
  const paires = useMemo(() => lot.slice(0, 6), [lot])

  const cartes = useMemo<Carte[]>(
    () =>
      melanger(
        paires.flatMap((entree) => [
          { cle: `${entree.id}-image`, entreeId: entree.id, face: 'image' as const },
          { cle: `${entree.id}-son`, entreeId: entree.id, face: 'son' as const },
        ]),
      ),
    [paires],
  )

  const [retournees, setRetournees] = useState<string[]>([])
  const [trouvees, setTrouvees] = useState<string[]>([])
  const [rates, setRates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (trouvees.length > 0 && trouvees.length === paires.length) {
      onTermine(paires.map((entree) => ({ entreeId: entree.id, reussi: !rates.has(entree.id) })))
    }
  }, [trouvees, paires, rates, onTermine])

  function retourner(carte: Carte) {
    if (trouvees.includes(carte.entreeId) || retournees.includes(carte.cle)) return

    const entree = artefact.entrees.find((e) => e.id === carte.entreeId)
    if (entree && carte.face === 'son') void lecteur.jouer(urlAudio(artefact, entree))

    const ouvertes = [...retournees, carte.cle]
    if (ouvertes.length < 2) {
      setRetournees(ouvertes)
      return
    }

    const premiere = ouvertes[0]
    const autre = cartes.find((c) => c.cle === premiere)
    if (autre && autre.entreeId === carte.entreeId) {
      setTrouvees((precedentes) => [...precedentes, carte.entreeId])
      setRetournees([])
    } else {
      if (autre) setRates((precedents) => new Set(precedents).add(autre.entreeId))
      setRetournees(ouvertes)
      setTimeout(() => setRetournees([]), 700)
    }
  }

  return (
    <main style={{ display: 'grid', gap: 16, placeItems: 'center', padding: 16, minHeight: '100dvh' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cartes.map((carte) => {
          const entree = artefact.entrees.find((e) => e.id === carte.entreeId)
          const visible = retournees.includes(carte.cle) || trouvees.includes(carte.entreeId)
          return (
            <button
              key={carte.cle}
              type="button"
              onClick={() => retourner(carte)}
              style={{
                fontSize: 44,
                width: 96,
                height: 96,
                borderRadius: 16,
                border: '3px solid #e6d9c6',
                background: visible ? '#fff' : '#e8d9bf',
                opacity: trouvees.includes(carte.entreeId) ? 0.4 : 1,
              }}
            >
              {!visible ? '' : carte.face === 'image' ? emoji(entree?.picto ?? '') : '🔊'}
            </button>
          )
        })}
      </div>
    </main>
  )
}
