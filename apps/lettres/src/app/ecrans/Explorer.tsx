'use client'

import { useEffect, useState } from 'react'
import { ALPHABET } from '@/alphabet'
import { couleurDe } from '@/couleurs'
import { dire, taire } from '@/parole'
import { Lettre } from '@/interface/Lettre'
import { Retour } from '@/interface/Retour'

/**
 * Explorer.
 *
 * Les 26 majuscules, aussi grandes que l'écran le permet. Elle touche, elle
 * entend. Rien ne peut échouer, il n'y a ni ordre à suivre ni fin à atteindre :
 * à trois ans, la découverte libre précède tout exercice.
 */
export function Explorer({ onRetour }: { onRetour: () => void }) {
  const [dite, setDite] = useState<string | null>(null)

  // Quitter l'écran coupe la parole en cours, sinon elle continue par-dessus
  // l'écran suivant.
  useEffect(() => taire, [])

  function toucher(glyphe: string, texte: string) {
    setDite(glyphe)
    void dire(texte)
    // Le rebond dit « ta touche a compté », indépendamment de la durée réelle
    // de la parole, qui varie d'une voix à l'autre.
    setTimeout(() => setDite((actuelle) => (actuelle === glyphe ? null : actuelle)), 400)
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-bloc pt-carte pb-large">
      <header className="flex items-center gap-carte">
        <Retour onClick={onRetour} />
        <h1 className="text-2xl font-bold text-encre">Écouter les lettres</h1>
      </header>

      <div
        className="mt-large grid justify-center gap-carte"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(var(--spacing-lettre), 1fr))',
        }}
      >
        {ALPHABET.map((lettre) => (
          <Lettre
            key={lettre.glyphe}
            glyphe={lettre.glyphe}
            couleur={couleurDe(lettre.glyphe)}
            etat={dite === lettre.glyphe ? 'dit' : 'repos'}
            onClick={() => toucher(lettre.glyphe, lettre.dit)}
          />
        ))}
      </div>
    </main>
  )
}
