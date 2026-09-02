'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Attente } from '../contexte/Attente.js'
import { useAwal } from '../contexte/FournisseurAwal.js'
import { Accueil } from '../ecrans/Accueil.js'
import { OPTIONS_PAR_AGE, composerSession, serie } from '@/moteur/session.js'
import { urlAudio } from '@/corpus/charger.js'

export default function PageJouer() {
  const router = useRouter()
  const { artefact, profil, progression, pret, lecteur, demarrerLot } = useAwal()

  // Sans profil actif, il n'y a rien à afficher ici — mais seulement après que
  // la restauration du profil retenu a été tentée.
  useEffect(() => {
    if (pret && !profil) router.replace('/')
  }, [pret, profil, router])

  return (
    <Attente>
      {artefact && profil && progression ? (
        <Accueil
          profil={profil}
          serie={serie(progression, new Date())}
          aFaire={
            composerSession(artefact.entrees, progression, OPTIONS_PAR_AGE(profil.age), new Date())
              .length
          }
          onDemarrer={async () => {
            const lot = composerSession(
              artefact.entrees,
              progression,
              OPTIONS_PAR_AGE(profil.age),
              new Date(),
            )
            if (lot.length === 0) return
            demarrerLot(lot)
            await lecteur.precharger(lot.map((entree) => urlAudio(artefact, entree)))
            router.push('/jouer/session')
          }}
          onEntrainement={() => router.push('/mots')}
          onCollection={() => router.push('/jouer/collection')}
          onChangerProfil={() => router.push('/')}
        />
      ) : null}
    </Attente>
  )
}
