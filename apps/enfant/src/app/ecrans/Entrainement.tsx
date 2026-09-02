'use client'

import { emoji } from '@/jeux/emoji.js'
import type { ThemeDisponible } from '@/moteur/entrainement.js'

/**
 * Choix du thème pour l'entraînement libre. Les thèmes non encore abordés
 * ne sont pas affichés : le spec voulait qu'aucun thème ne soit verrouillé,
 * mais proposer un thème vide n'ouvrirait que sur un écran sans rien.
 */
export function Entrainement({
  disponibles,
  onChoisir,
  onRetour,
}: {
  disponibles: ThemeDisponible[]
  onChoisir: (themeId?: string) => void
  onRetour: () => void
}) {
  return (
    <main style={{ padding: 20, minHeight: '100dvh' }}>
      <button
        type="button"
        onClick={onRetour}
        aria-label="retour"
        style={{ fontSize: 20, padding: '8px 16px', borderRadius: 12, border: '3px solid #e6d9c6', background: '#fff' }}
      >
        ←
      </button>

      <h1 style={{ fontSize: 24, marginTop: 16 }}>S’entraîner</h1>

      {disponibles.length === 0 ? (
        <p style={{ fontSize: 18, opacity: 0.7 }}>
          Fais d’abord une session du jour, et tu pourras rejouer tes mots ici.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => onChoisir(undefined)}
            style={{
              width: 150, height: 110, borderRadius: 20, border: '3px solid #c94f3d',
              background: '#fff', display: 'grid', placeItems: 'center', gap: 2, fontSize: 16,
            }}
          >
            <span style={{ fontSize: 34 }}>🎲</span>
            <span>Un peu de tout</span>
          </button>

          {disponibles.map(({ theme, nombre }) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChoisir(theme.id)}
              style={{
                width: 150, height: 110, borderRadius: 20, border: `3px solid ${theme.couleur}`,
                background: '#fff', display: 'grid', placeItems: 'center', gap: 2, fontSize: 15,
              }}
            >
              <span style={{ fontSize: 34 }}>{emoji(theme.picto)}</span>
              <span>{theme.nom}</span>
              <span style={{ opacity: 0.55, fontSize: 13 }}>{nombre} mots</span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
