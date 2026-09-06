'use client'

import type { Artefact, Entree, Theme } from '@awal/corpus'
import { Picto } from '@/jeux/Picto'

/**
 * Grille des thèmes.
 *
 * Partagée par l'imagier et l'Écho : les deux écrans commencent par faire
 * choisir un thème, parce que 243 cartes d'un seul tenant découragent avant
 * même d'avoir commencé.
 */
export function ListeThemes({
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

/** Regroupe les entrées par thème. Les deux écrans en ont besoin à l'identique. */
export function grouperParTheme(artefact: Artefact): Map<string, Entree[]> {
  const table = new Map<string, Entree[]>()
  for (const theme of artefact.themes) {
    table.set(
      theme.id,
      artefact.entrees.filter((entree) => entree.themes.includes(theme.id)),
    )
  }
  return table
}
