'use client'

import { useMemo, useState } from 'react'
import type { Artefact, Entree, Theme } from '@awal/corpus'
import type { Lecteur } from '@/audio/lecteur.js'
import { urlAudio } from '@/corpus/charger.js'
import { emoji } from '@/jeux/emoji.js'

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
    <main style={{ padding: 20, paddingBottom: 48, minHeight: '100dvh' }}>
      <header style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button
          type="button"
          onClick={retour}
          aria-label="retour"
          style={{
            fontSize: 20, padding: '8px 16px', borderRadius: 12,
            border: '3px solid #e6d9c6', background: '#fff',
          }}
        >
          ←
        </button>
        {choisi ? (
          <h1 style={{ fontSize: 22, margin: 0, color: choisi.couleur }}>
            {emoji(choisi.picto)} {choisi.nom}
          </h1>
        ) : (
          <h1 style={{ fontSize: 22, margin: 0 }}>Écouter les mots</h1>
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 22 }}>
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
            style={{
              width: 158,
              height: 132,
              borderRadius: 22,
              border: `3px solid ${theme.couleur}`,
              background: '#fff',
              display: 'grid',
              placeItems: 'center',
              alignContent: 'center',
              gap: 4,
              fontSize: 16,
              padding: 8,
            }}
          >
            <span style={{ fontSize: 44, lineHeight: 1 }}>{emoji(theme.picto)}</span>
            <span style={{ lineHeight: 1.2, textAlign: 'center' }}>{theme.nom}</span>
            <span style={{ opacity: 0.55, fontSize: 13 }}>
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
      {entrees.map((entree) => (
        <button
          key={entree.id}
          type="button"
          onClick={() => ecouter(entree)}
          style={{
            width: 112,
            minHeight: 118,
            padding: '10px 6px',
            borderRadius: 18,
            border: `3px solid ${enCours === entree.id ? couleur : '#e6d9c6'}`,
            background: enCours === entree.id ? '#fff8ee' : '#fff',
            display: 'grid',
            gap: 4,
            placeItems: 'center',
            alignContent: 'center',
          }}
        >
          <span style={{ fontSize: 42, lineHeight: 1 }}>{emoji(entree.picto)}</span>
          <span style={{ fontSize: 14, lineHeight: 1.2, textAlign: 'center' }}>{entree.fr}</span>
        </button>
      ))}
    </div>
  )
}
