'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Attente } from '../../contexte/Attente'
import { useAwal } from '../../contexte/FournisseurAwal'
import { Collection } from '../../ecrans/Collection'

export default function PageCollection() {
  const router = useRouter()
  const { artefact, progression, profil, pret } = useAwal()

  useEffect(() => {
    if (pret && !profil) router.replace('/')
  }, [pret, profil, router])

  return (
    <Attente>
      {artefact && progression ? (
        <Collection
          artefact={artefact}
          progression={progression}
          onRetour={() => router.push('/jouer')}
        />
      ) : null}
    </Attente>
  )
}
