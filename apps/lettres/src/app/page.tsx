'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Accueil } from './ecrans/Accueil'
import { ALPHABET } from '@/alphabet'
import { dire, disponible, trouverVoix } from '@/parole'

export default function PageAccueil() {
  const router = useRouter()
  const [muette, setMuette] = useState(false)

  /*
   * On cherche la voix sans rien prononcer.
   *
   * La sonde parlait auparavant une chaîne vide, pour peupler la liste des
   * voix. C'était un énoncé fantôme : il n'émet ni début ni fin sur plusieurs
   * moteurs, et il laissait `speaking` à vrai, ce qui coinçait la parole
   * suivante. `trouverVoix` fait le même travail sans mettre quoi que ce soit
   * en file.
   */
  useEffect(() => {
    if (!disponible()) return setMuette(true)
    void trouverVoix().then((voix) => setMuette(voix === null))
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
