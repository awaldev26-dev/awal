'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Entree } from '@awal/corpus'
import { Attente } from '../../contexte/Attente'
import { useAwal } from '../../contexte/FournisseurAwal'
import { Bilan } from '../../ecrans/Bilan'
import { estAcquise } from '@/moteur/leitner'

export default function PageBilan() {
  const router = useRouter()
  const { artefact, progression, derniersResultats } = useAwal()

  // Rien à célébrer sans session terminée — cas d'un rechargement direct.
  useEffect(() => {
    if (derniersResultats.length === 0) router.replace('/jouer')
  }, [derniersResultats, router])

  if (!artefact || !progression || derniersResultats.length === 0) {
    return <Attente>{null}</Attente>
  }

  const acquises = derniersResultats
    .map((resultat) => resultat.entreeId)
    .filter((id) => {
      const etat = progression.etats[id]
      return etat !== undefined && estAcquise(etat)
    })
    .map((id) => artefact.entrees.find((entree) => entree.id === id))
    .filter((entree): entree is Entree => entree !== undefined)

  return (
    <Bilan acquises={acquises} artefact={artefact} onContinuer={() => router.replace('/jouer')} />
  )
}
