'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Accueil } from './ecrans/Accueil'
import { ALPHABET } from '@/alphabet'
import { dire, disponible, voixFrancaiseTrouvee } from '@/parole'

export default function PageAccueil() {
  const router = useRouter()
  const [muette, setMuette] = useState(false)

  /*
   * On sonde la voix au chargement, avec une parole vide : la liste des voix
   * n'est peuplée qu'après une première tentative sur certains moteurs, et
   * `voixFrancaiseTrouvee` renverrait sinon un faux négatif.
   *
   * Une chaîne vide ne produit aucun son, donc rien ne se déclenche sans geste.
   */
  useEffect(() => {
    if (!disponible()) return setMuette(true)
    void dire('').then(() => setMuette(!voixFrancaiseTrouvee()))
  }, [])

  return (
    <Accueil
      paroleMuette={muette}
      onExplorer={() => {
        // Première parole issue d'un geste : c'est ce qu'exige iOS, et c'est
        // aussi ce qui réveille le moteur avant l'écran suivant.
        void dire(ALPHABET[0]!.dit)
        router.push('/explorer')
      }}
      onTrouver={() => router.push('/trouver')}
    />
  )
}
