'use client'

import { useState } from 'react'
import type { Artefact, Entree } from '@awal/corpus'
import type { Lecteur } from '@/audio/lecteur.js'
import { urlAudio } from '@/corpus/charger.js'
import { emoji } from '@/jeux/emoji.js'

/**
 * Imagier consultable : toutes les cartes visibles, image et traduction, et
 * la prononciation à la demande.
 *
 * Volontairement dépourvu de jeu, de score et de progression. C'est un
 * dictionnaire visuel où l'on ne peut pas se tromper, ce qui en fait le
 * complément de la session du jour plutôt qu'un second exercice.
 */
export function Imagier({
  artefact,
  lecteur,
  onRetour,
}: {
  artefact: Artefact
  lecteur: Lecteur
  onRetour: () => void
}) {
  const [enCours, setEnCours] = useState<string | null>(null)

  function ecouter(entree: Entree) {
    setEnCours(entree.id)
    void lecteur.jouer(urlAudio(artefact, entree))
    // Le retour visuel dit simplement « ta touche a été prise en compte ».
    setTimeout(() => setEnCours((actuel) => (actuel === entree.id ? null : actuel)), 700)
  }

  return (
    <main style={{ padding: 16, paddingBottom: 48, minHeight: '100dvh' }}>
      <button
        type="button"
        onClick={onRetour}
        aria-label="retour"
        style={{
          fontSize: 20, padding: '8px 16px', borderRadius: 12,
          border: '3px solid #e6d9c6', background: '#fff',
          position: 'sticky', top: 8, zIndex: 1,
        }}
      >
        ←
      </button>

      {artefact.themes.map((theme) => {
        const duTheme = artefact.entrees.filter((entree) => entree.themes.includes(theme.id))
        if (duTheme.length === 0) return null

        return (
          <section key={theme.id} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 20, color: theme.couleur, margin: '0 0 10px' }}>{theme.nom}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {duTheme.map((entree) => (
                <button
                  key={entree.id}
                  type="button"
                  onClick={() => ecouter(entree)}
                  style={{
                    width: 112,
                    minHeight: 118,
                    padding: '10px 6px',
                    borderRadius: 18,
                    border: `3px solid ${enCours === entree.id ? theme.couleur : '#e6d9c6'}`,
                    background: enCours === entree.id ? '#fff8ee' : '#fff',
                    display: 'grid',
                    gap: 4,
                    placeItems: 'center',
                    alignContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 42, lineHeight: 1 }}>{emoji(entree.picto)}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.2, textAlign: 'center' }}>
                    {entree.fr}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
