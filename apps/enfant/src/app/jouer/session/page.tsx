'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Attente } from '../../contexte/Attente.js'
import { useAwal } from '../../contexte/FournisseurAwal.js'
import { EcouteEtChoisis } from '@/jeux/EcouteEtChoisis.js'

export default function PageSession() {
  const router = useRouter()
  const { artefact, lot, lecteur, terminerLot } = useAwal()

  // Le lot est volatil : après un rechargement il n'y a plus de session en
  // cours, on renvoie à l'accueil plutôt que d'afficher un écran vide.
  // Le drapeau évite que le vidage du lot en fin de session déclenche cette
  // garde avant que la navigation vers le bilan ait abouti.
  const termine = useRef(false)
  useEffect(() => {
    if (lot.length === 0 && !termine.current) router.replace('/jouer')
  }, [lot, router])

  return (
    <Attente>
      {artefact && lot.length > 0 ? (
        <EcouteEtChoisis
          lot={lot}
          artefact={artefact}
          lecteur={lecteur}
          onTermine={(resultats) => {
            termine.current = true
            terminerLot(resultats)
            router.replace('/jouer/bilan')
          }}
        />
      ) : null}
    </Attente>
  )
}
