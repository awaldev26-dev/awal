'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Attente } from '../contexte/Attente'
import { useAwal } from '../contexte/FournisseurAwal'
import { Imagier } from '../ecrans/Imagier'

/**
 * Le thème passe par un paramètre de requête plutôt qu'une route `/mots/[theme]` :
 * les thèmes viennent du corpus téléchargé à l'exécution, l'export statique ne
 * peut donc pas les prégénérer.
 */
function Contenu() {
  const router = useRouter()
  const parametres = useSearchParams()
  const { artefact, lecteur, profil } = useAwal()

  const themeId = parametres.get('theme')
  const theme = artefact?.themes.find((candidat) => candidat.id === themeId) ?? null

  return (
    <Attente>
      {artefact ? (
        <Imagier
          artefact={artefact}
          lecteur={lecteur}
          theme={theme}
          onChoisirTheme={(choisi) =>
            router.push(choisi ? `/mots?theme=${choisi.id}` : '/mots')
          }
          onRetour={() => router.push(profil ? '/jouer' : '/')}
        />
      ) : null}
    </Attente>
  )
}

export default function PageMots() {
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
