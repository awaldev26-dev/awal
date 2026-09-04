'use client'

import { useMemo, useState } from 'react'
import type { Artefact, Entree, Theme } from '@awal/corpus'
import type { Lecteur } from '@/audio/lecteur'
import { urlAudio } from '@/corpus/charger'
import { BoutonRetour } from '@/interface/BoutonRetour'
import { Picto } from '@/jeux/Picto'

/**
 * Imagier consultable, en deux temps : les thèmes, puis les cartes du thème
 * choisi. Tout afficher d'un seul tenant faisait un mur de 243 cartes,
 * décourageant avant même d'avoir commencé.
 *
 * Le thème courant vient de l'URL et non d'un état interne : le geste de retour
 * du système remonte ainsi d'un niveau, au lieu de fermer l'application.
 *
 * Volontairement dépourvu de jeu, de score et de progression : c'est un
 * dictionnaire visuel où l'on ne peut pas se tromper.
 */
export function Imagier({
  artefact,
  lecteur,
  theme: choisi,
  onChoisirTheme,
  onRetour,
}: {
  artefact: Artefact
  lecteur: Lecteur
  theme: Theme | null
  onChoisirTheme: (theme: Theme | null) => void
  onRetour: () => void
}) {
  const parTheme = useMemo(() => {
    const table = new Map<string, Entree[]>()
    for (const theme of artefact.themes) {
      table.set(
        theme.id,
        artefact.entrees.filter((entree) => entree.themes.includes(theme.id)),
      )
    }
    return table
  }, [artefact])

  const retour = () => (choisi ? onChoisirTheme(null) : onRetour())

  return (
    <main className="mx-auto w-full max-w-3xl px-bloc pt-carte pb-large">
      <header className="flex items-center gap-carte">
        <BoutonRetour onClick={retour} />
        {choisi ? (
          <h1
            className="flex min-w-0 items-center gap-2 font-mot text-2xl"
            style={{ color: choisi.couleur }}
          >
            <Picto picto={choisi.picto} artefact={artefact} taille="1.75rem" />
            <span className="truncate">{choisi.nom}</span>
          </h1>
        ) : (
          <h1 className="font-mot text-2xl text-encre">Écouter les mots</h1>
        )}
      </header>

      {choisi === null ? (
        <ListeThemes artefact={artefact} parTheme={parTheme} onChoisir={onChoisirTheme} />
      ) : (
        <Cartes
          entrees={parTheme.get(choisi.id) ?? []}
          couleur={choisi.couleur}
          artefact={artefact}
          lecteur={lecteur}
        />
      )}
    </main>
  )
}

function ListeThemes({
  artefact,
  parTheme,
  onChoisir,
}: {
  artefact: Artefact
  parTheme: Map<string, Entree[]>
  onChoisir: (theme: Theme) => void
}) {
  return (
    <div
      className="mt-large grid gap-carte"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(9.5rem, 44vw), 1fr))' }}
    >
      {artefact.themes.map((theme) => {
        const duTheme = parTheme.get(theme.id) ?? []
        const nombre = duTheme.length
        if (nombre === 0) return null
        // « 30 mots » serait faux pour le thème des phrases.
        const unite = duTheme.every((entree) => entree.type === 'phrase') ? 'phrases' : 'mots'
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChoisir(theme)}
            className="grid content-center justify-items-center gap-1 rounded-touche bg-surface px-bloc py-bloc transition-transform duration-100 active:scale-[0.97]"
            // Aura de la couleur du thème : c'est elle qui identifie la tuile,
            // sans le contour net qui faisait « formulaire ».
            style={{ boxShadow: `0 0 22px 5px ${theme.couleur}4d` }}
          >
            <Picto picto={theme.picto} artefact={artefact} taille="2.75rem" />
            {/* Le nom porte la couleur du thème : c'est ce qui l'identifie,
                maintenant que le contour net a disparu. */}
            <span className="text-center leading-tight" style={{ color: theme.couleur }}>
              {theme.nom}
            </span>
            <span className="text-sm text-encre-douce">
              {nombre} {unite}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Cartes({
  entrees,
  couleur,
  artefact,
  lecteur,
}: {
  entrees: Entree[]
  couleur: string
  artefact: Artefact
  lecteur: Lecteur
}) {
  const [enCours, setEnCours] = useState<string | null>(null)

  function ecouter(entree: Entree) {
    setEnCours(entree.id)
    void lecteur.jouer(urlAudio(artefact, entree))
    // Le retour visuel dit simplement « ta touche a été prise en compte ».
    setTimeout(() => setEnCours((actuel) => (actuel === entree.id ? null : actuel)), 700)
  }

  return (
    <div
      className="mt-large grid gap-carte"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(6.5rem, 28vw), 1fr))' }}
    >
      {entrees.map((entree) => (
        <button
          key={entree.id}
          type="button"
          onClick={() => ecouter(entree)}
          className={[
            'grid content-center justify-items-center gap-1 rounded-carte px-2 py-carte',
            'transition-transform duration-150 active:scale-[0.97]',
            enCours === entree.id ? 'animate-rebond bg-safran-clair/40' : 'bg-surface',
          ].join(' ')}
          style={{
            boxShadow:
              enCours === entree.id
                ? `0 0 22px 4px ${couleur}55`
                : '0 0 14px 2px rgb(58 43 28 / 0.07)',
          }}
        >
          <Picto picto={entree.picto} artefact={artefact} taille="min(2.6rem, 11vw)" />
          <span className="text-center text-sm leading-tight text-encre-douce">{entree.fr}</span>
        </button>
      ))}
    </div>
  )
}
