'use client'

import type { Profil } from '@/stockage/magasin.js'

export function Accueil({
  profil, serie, aFaire, onDemarrer, onEntrainement, onCollection, onChangerProfil,
}: {
  profil: Profil
  serie: number
  aFaire: number
  onDemarrer: () => void
  onEntrainement: () => void
  onCollection: () => void
  onChangerProfil: () => void
}) {
  return (
    <main style={{ display: 'grid', gap: 28, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', alignSelf: 'stretch', justifyContent: 'space-between' }}>
        <button type="button" onClick={onChangerProfil} aria-label="changer de profil" style={{ background: 'none', border: 'none', fontSize: 32 }}>
          {profil.avatar}
        </button>
        {serie > 1 ? <span style={{ fontSize: 22 }}>🔥 {serie}</span> : <span />}
      </header>

      <button
        type="button"
        onClick={onDemarrer}
        disabled={aFaire === 0}
        style={{
          width: 260, height: 160, borderRadius: 32, border: 'none', fontSize: 26,
          background: aFaire === 0 ? '#e6d9c6' : '#c94f3d', color: '#fff', lineHeight: 1.3,
        }}
      >
        {aFaire === 0 ? <>Session faite !<br />🎉</> : <>Session du jour<br />▶</>}
      </button>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Jamais désactivé : la session du jour faite, c'est le seul moyen de
            continuer à jouer, et l'entraînement se rabat sur le vocabulaire du
            niveau quand rien n'a encore été rencontré. */}
        <button
          type="button"
          onClick={onEntrainement}
          style={{
            fontSize: 20, padding: '12px 28px', borderRadius: 16,
            border: '3px solid #e6d9c6', background: '#fff',
          }}
        >
          S’entraîner
        </button>

        <button
          type="button"
          onClick={onCollection}
          style={{ fontSize: 20, padding: '12px 28px', borderRadius: 16, border: '3px solid #e6d9c6', background: '#fff' }}
        >
          Ma collection
        </button>
      </div>
    </main>
  )
}
