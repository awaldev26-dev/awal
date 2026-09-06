'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Attente } from '../contexte/Attente'
import { useAwal } from '../contexte/FournisseurAwal'
import { Echo } from '../ecrans/Echo'

/**
 * Le thème passe par un paramètre de requête, comme pour l'imagier : les thèmes
 * viennent du corpus téléchargé à l'exécution, que l'export statique ne peut
 * pas prégénérer.
 */
function Contenu() {
  const router = useRouter()
  const parametres = useSearchParams()
  const { artefact, profil } = useAwal()

  const themeId = parametres.get('theme')
  const theme = artefact?.themes.find((candidat) => candidat.id === themeId) ?? null

  return (
    <Attente>
      {artefact ? (
        <Echo
          artefact={artefact}
          theme={theme}
          onChoisirTheme={(choisi) => router.push(choisi ? `/echo?theme=${choisi.id}` : '/echo')}
          onRetour={() => router.push(profil ? '/jouer' : '/')}
        />
      ) : null}
    </Attente>
  )
}

export default function PageEcho() {
  // useSearchParams exige une frontière de suspension en export statique.
  return (
    <Suspense
      fallback={
        <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', fontSize: 64 }}>
          ⏳
        </main>
      }
    >
      <Contenu />
    </Suspense>
  )
}
