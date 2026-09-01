'use client'

import { useState } from 'react'
import { AVATARS, type MagasinProgression, type Profil } from '@/stockage/magasin.js'

export function ChoixProfil({
  magasin,
  onChoisi,
}: {
  magasin: MagasinProgression
  onChoisi: (profil: Profil) => void
}) {
  const [profils, setProfils] = useState<Profil[]>(() => magasin.profils())
  const [creation, setCreation] = useState(profils.length === 0)
  const [prenom, setPrenom] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0]!)
  const [age, setAge] = useState(7)

  function creer() {
    const propre = prenom.trim()
    if (!propre) return
    const profil: Profil = {
      id: `${propre.toLowerCase().replace(/[^a-z0-9]/g, '')}-${age}`,
      prenom: propre,
      avatar,
      age,
    }
    magasin.ajouterProfil(profil)
    setProfils(magasin.profils())
    setCreation(false)
    setPrenom('')
  }

  if (creation) {
    return (
      <main style={{ display: 'grid', gap: 20, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
        <h1 style={{ fontSize: 28 }}>Qui joue ?</h1>
        <input
          value={prenom}
          onChange={(evenement) => setPrenom(evenement.target.value)}
          placeholder="Prénom"
          style={{ fontSize: 24, padding: 12, textAlign: 'center', borderRadius: 12, border: '2px solid #e6d9c6' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 420 }}>
          {AVATARS.map((choix) => (
            <button
              key={choix}
              type="button"
              onClick={() => setAvatar(choix)}
              aria-label={`avatar ${choix}`}
              style={{
                fontSize: 36, width: 64, height: 64, borderRadius: 16, background: '#fff',
                border: avatar === choix ? '3px solid #c94f3d' : '3px solid #e6d9c6',
              }}
            >
              {choix}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[5, 6, 7, 8, 9, 10, 11].map((valeur) => (
            <button
              key={valeur}
              type="button"
              onClick={() => setAge(valeur)}
              style={{
                fontSize: 20, width: 48, height: 48, borderRadius: 12, background: '#fff',
                border: age === valeur ? '3px solid #c94f3d' : '3px solid #e6d9c6',
              }}
            >
              {valeur}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={creer}
          style={{ fontSize: 22, padding: '14px 32px', borderRadius: 16, border: 'none', background: '#c94f3d', color: '#fff' }}
        >
          C’est parti
        </button>
      </main>
    )
  }

  return (
    <main style={{ display: 'grid', gap: 24, placeItems: 'center', padding: 24, minHeight: '100dvh' }}>
      <h1 style={{ fontSize: 28 }}>Qui joue ?</h1>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {profils.map((profil) => (
          <button
            key={profil.id}
            type="button"
            onClick={() => onChoisi(profil)}
            style={{
              display: 'grid', placeItems: 'center', gap: 4, width: 120, height: 140,
              borderRadius: 24, border: '3px solid #e6d9c6', background: '#fff',
            }}
          >
            <span style={{ fontSize: 56 }}>{profil.avatar}</span>
            <span style={{ fontSize: 18 }}>{profil.prenom}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreation(true)}
          aria-label="ajouter un profil"
          style={{ width: 120, height: 140, borderRadius: 24, border: '3px dashed #e6d9c6', background: 'none', fontSize: 48 }}
        >
          ＋
        </button>
      </div>
    </main>
  )
}
