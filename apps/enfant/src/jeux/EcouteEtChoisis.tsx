'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Entree } from '@awal/corpus'
import { urlAudio } from '@/corpus/charger.js'
import type { ResultatEntree } from '@/moteur/types.js'
import { choisirDistracteurs, melanger } from './choisirDistracteurs.js'
import { emoji } from './emoji.js'
import type { ProprietesJeu } from './types.js'

export function EcouteEtChoisis({ lot, artefact, lecteur, onTermine }: ProprietesJeu) {
  const [index, setIndex] = useState(0)
  const [resultats, setResultats] = useState<ResultatEntree[]>([])
  const [ecartees, setEcartees] = useState<string[]>([])
  const [rate, setRate] = useState(false)

  const cible = lot[index]

  const choix = useMemo(() => {
    if (!cible) return []
    return melanger([cible, ...choisirDistracteurs(cible, artefact.entrees, 3)])
  }, [cible, artefact])

  useEffect(() => {
    if (cible) void lecteur.jouer(urlAudio(artefact, cible))
    setEcartees([])
    setRate(false)
  }, [cible, artefact, lecteur])

  if (!cible) return null

  function repondre(entree: Entree) {
    if (!cible) return
    if (entree.id === cible.id) {
      const suivants = [...resultats, { entreeId: cible.id, reussi: !rate }]
      setResultats(suivants)
      if (index + 1 >= lot.length) onTermine(suivants)
      else setIndex(index + 1)
      return
    }
    // L'erreur ne punit pas : on écarte le mauvais choix, on rejoue, on laisse réessayer.
    setRate(true)
    setEcartees((precedentes) => [...precedentes, entree.id])
    void lecteur.jouer(urlAudio(artefact, cible))
  }

  return (
    <main style={{ display: 'grid', gap: 24, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <button
        type="button"
        onClick={() => lecteur.jouer(urlAudio(artefact, cible))}
        style={{ fontSize: 64, background: 'none', border: 'none' }}
        aria-label="réécouter"
      >
        🔊
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {choix.map((entree) => (
          <button
            key={entree.id}
            type="button"
            onClick={() => repondre(entree)}
            disabled={ecartees.includes(entree.id)}
            aria-label={entree.fr}
            style={{
              fontSize: 72,
              width: 140,
              height: 140,
              borderRadius: 24,
              border: '3px solid #e6d9c6',
              background: '#fff',
              opacity: ecartees.includes(entree.id) ? 0.25 : 1,
            }}
          >
            {emoji(entree.picto)}
          </button>
        ))}
      </div>
    </main>
  )
}
