'use client'

import { useCallback, useEffect, useState } from 'react'
import { ALPHABET } from '@/alphabet'
import { tirerQuestion, type Question } from '@/choix'
import { couleurDe } from '@/couleurs'
import { dire, taire } from '@/parole'
import { Fete } from '@/interface/Fete'
import { Lettre } from '@/interface/Lettre'
import { Retour } from '@/interface/Retour'
import { Touche } from '@/interface/Touche'

/** Trois choix : deux serait trivial, quatre trop à balayer du regard à trois ans. */
const NOMBRE_CHOIX = 3

/** Temps laissé à la fête avant la question suivante. */
const FETE_MS = 1400

/**
 * Trouve la lettre.
 *
 * Elle entend une lettre, elle la touche parmi trois.
 *
 * Aucune sanction : une erreur fait balancer la tuile et rejoue le son, rien de
 * plus. Pas de buzzer, pas de croix rouge, pas de score — à trois ans, une
 * correction sonore devient un mauvais souvenir, pas un apprentissage.
 *
 * Et pas de fin : l'exercice enchaîne tant qu'elle joue. Une barre de
 * progression n'aurait aucun sens pour quelqu'un qui ne compte pas encore.
 */
export function Trouver({ onRetour }: { onRetour: () => void }) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [refusee, setRefusee] = useState<string | null>(null)
  const [reussie, setReussie] = useState<string | null>(null)
  // Verrouille les touches pendant la fête, sinon un martèlement enchaînerait
  // plusieurs questions sans qu'elle en voie aucune.
  const [verrouille, setVerrouille] = useState(false)

  const poser = useCallback(() => {
    const suivante = tirerQuestion(ALPHABET, NOMBRE_CHOIX)
    setQuestion(suivante)
    setRefusee(null)
    setReussie(null)
    setVerrouille(false)
    if (suivante) void dire(suivante.cible.dit)
  }, [])

  useEffect(() => {
    poser()
    return taire
  }, [poser])

  if (!question) return null

  function toucher(glyphe: string) {
    if (verrouille) return

    if (glyphe !== question!.cible.glyphe) {
      setRefusee(glyphe)
      // Le son se rejoue : elle a probablement oublié ce qu'elle cherchait.
      void dire(question!.cible.dit)
      setTimeout(() => setRefusee((actuelle) => (actuelle === glyphe ? null : actuelle)), 450)
      return
    }

    setVerrouille(true)
    setReussie(glyphe)
    void dire(question!.cible.dit)
    setTimeout(poser, FETE_MS)
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-bloc pt-carte pb-large">
      <Fete actif={reussie !== null} />

      <header className="flex items-center gap-carte">
        <Retour onClick={onRetour} />
        <h1 className="text-2xl font-bold text-encre">Trouve la lettre</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-large">
        {/* Aussi grand que les lettres : elle oubliera ce qu'elle cherche, et
            redemander le son doit être aussi facile que répondre. */}
        <Touche
          ton="calme"
          onClick={() => dire(question.cible.dit)}
          disabled={verrouille}
          aria-label="réécouter la lettre"
        >
          <span className="text-5xl leading-none">👂</span>
        </Touche>

        {/* Grille de trois colonnes et non un flex qui déborde : trois tuiles
            plus les écarts dépassaient la largeur utile à 390 px, et
            repassaient en deux lignes. */}
        <div className="grid w-full grid-cols-3 gap-carte">
          {question.propositions.map((lettre) => (
            <Lettre
              key={lettre.glyphe}
              glyphe={lettre.glyphe}
              couleur={couleurDe(lettre.glyphe)}
              taille="100%"
              police="min(4.5rem, 15vw)"
              etat={
                reussie === lettre.glyphe
                  ? 'reussi'
                  : refusee === lettre.glyphe
                    ? 'refuse'
                    : 'repos'
              }
              onClick={() => toucher(lettre.glyphe)}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
