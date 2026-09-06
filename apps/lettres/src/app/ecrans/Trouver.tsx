'use client'

import { useCallback, useEffect, useState } from 'react'
import { ALPHABET } from '@/alphabet'
import { tirerQuestion, type Question } from '@/choix'
import { couleurDe } from '@/couleurs'
import { dire, taire } from '@/parole'
import { Fete } from '@/interface/Fete'
import { Lettre } from '@/interface/Lettre'
import { Retour } from '@/interface/Retour'

/** Trois choix : deux serait trivial, quatre trop à balayer du regard à trois ans. */
const NOMBRE_CHOIX = 3

/** Temps laissé à la fête avant la question suivante. */
const FETE_MS = 1200

/**
 * Trouve la lettre.
 *
 * Elle appuie sur l'oreille pour entendre la lettre, puis la touche parmi trois.
 *
 * **Le son ne vient que de l'oreille.** La version précédente rejouait la lettre
 * à chaque appui, y compris sur une bonne réponse : d'une aide, la voix
 * devenait un rabâchage. C'est elle qui décide maintenant quand entendre, ce
 * qui a deux vertus — l'écran est calme, et toute parole descend d'un geste,
 * ce qu'exige Safari.
 *
 * Aucune sanction : une erreur écarte la lettre touchée, estompée et hors jeu,
 * et l'on réessaie. Écartée plutôt que supprimée, car retirer une tuile
 * décalerait les autres et ferait taper à côté. Trois choix, donc deux erreurs
 * au pire : la réussite est garantie, seul le chemin change.
 */
export function Trouver({ onRetour }: { onRetour: () => void }) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [ecartees, setEcartees] = useState<string[]>([])
  const [trouvee, setTrouvee] = useState<string | null>(null)

  const poser = useCallback(() => {
    setQuestion(tirerQuestion(ALPHABET, NOMBRE_CHOIX))
    setEcartees([])
    setTrouvee(null)
  }, [])

  useEffect(() => {
    poser()
    return taire
  }, [poser])

  if (!question) return null

  function toucher(glyphe: string) {
    // Une fois trouvée, plus rien ne compte : sans ce verrou, un martèlement
    // enchaînerait plusieurs questions sans qu'elle en voie aucune.
    if (trouvee !== null || ecartees.includes(glyphe)) return

    if (glyphe !== question!.cible.glyphe) {
      setEcartees((precedentes) => [...precedentes, glyphe])
      return
    }

    setTrouvee(glyphe)
    setTimeout(poser, FETE_MS)
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-bloc pt-carte pb-large">
      <Fete actif={trouvee !== null} />

      <header className="flex items-center gap-carte">
        <Retour onClick={onRetour} />
        <h1 className="text-2xl font-bold text-encre">Trouve la lettre</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-large">
        {/*
          Seule source de son de l'écran, donc la plus grande touche et la seule
          qui bouge : à trois ans, on ne lit pas une consigne, on suit ce qui
          attire l'œil.
        */}
        <button
          type="button"
          onClick={() => dire(question.cible.dit)}
          disabled={trouvee !== null}
          aria-label="écouter la lettre"
          className={[
            'grid size-28 place-items-center rounded-pilule bg-accent text-6xl shadow-halo-fort',
            'transition-transform duration-100 active:scale-[0.96] disabled:opacity-45',
            trouvee === null ? 'animate-flotte' : '',
          ].join(' ')}
        >
          👂
        </button>

        <div className="grid w-full grid-cols-3 gap-carte">
          {question.propositions.map((lettre) => {
            const ecartee = ecartees.includes(lettre.glyphe)
            const gagnante = trouvee === lettre.glyphe
            return (
              <Lettre
                key={lettre.glyphe}
                glyphe={lettre.glyphe}
                couleur={couleurDe(lettre.glyphe)}
                taille="100%"
                police="min(4.5rem, 15vw)"
                etat={gagnante ? 'reussi' : ecartee ? 'ecartee' : 'repos'}
                onClick={() => toucher(lettre.glyphe)}
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}
