'use client'

import { useRouter } from 'next/navigation'
import { ChoixProfil } from './ecrans/ChoixProfil.js'
import { useAwal, useMagasin } from './contexte/FournisseurAwal.js'

export default function PageProfils() {
  const router = useRouter()
  const magasin = useMagasin()
  const { choisirProfil } = useAwal()

  return (
    <ChoixProfil
      magasin={magasin}
      onChoisi={(profil) => {
        choisirProfil(profil)
        router.push('/jouer')
      }}
    />
  )
}
