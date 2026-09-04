'use client'

import { useState } from 'react'
import { Touche } from '@/interface/Touche'
import { AVATARS, type MagasinProgression, type Profil } from '@/stockage/magasin'

const AGES = [5, 6, 7, 8, 9, 10, 11]

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

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-2xl content-center justify-items-center gap-large px-bloc py-large">
      <h1 className="animate-apparition text-center text-3xl text-encre">Qui joue&nbsp;?</h1>

      {creation ? (
        <div className="grid w-full justify-items-center gap-bloc">
          <input
            value={prenom}
            onChange={(evenement) => setPrenom(evenement.target.value)}
            onKeyDown={(evenement) => evenement.key === 'Enter' && creer()}
            placeholder="Ton prénom"
            aria-label="prénom"
            autoFocus
            className="w-full max-w-xs rounded-carte bg-surface shadow-halo px-bloc py-3 text-center text-2xl text-encre placeholder:text-encre-douce/50 focus:shadow-halo-fort focus:outline-none"
          />

          {/* grid auto-fit : les avatars se répartissent sans jamais déborder,
              quelle que soit la largeur de l'écran. */}
          <div
            className="grid w-full gap-serre"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(3.5rem, 1fr))' }}
          >
            {AVATARS.map((choix) => (
              <button
                key={choix}
                type="button"
                onClick={() => setAvatar(choix)}
                aria-label={`avatar ${choix}`}
                aria-pressed={avatar === choix}
                className={[
                  'grid aspect-square place-items-center rounded-carte text-3xl transition',
                  'active:scale-95',
                  avatar === choix
                    ? 'bg-safran-clair shadow-halo-fort'
                    : 'bg-surface shadow-halo',
                ].join(' ')}
              >
                {choix}
              </button>
            ))}
          </div>

          <div className="grid w-full gap-serre" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(2.75rem, 1fr))' }}>
            {AGES.map((valeur) => (
              <button
                key={valeur}
                type="button"
                onClick={() => setAge(valeur)}
                aria-pressed={age === valeur}
                className={[
                  'grid aspect-square place-items-center rounded-carte text-xl transition',
                  'active:scale-95',
                  age === valeur
                    ? 'bg-indigo text-white shadow-halo-fort'
                    : 'bg-surface text-encre shadow-halo',
                ].join(' ')}
              >
                {valeur}
              </button>
            ))}
          </div>

          <Touche ton="accent" taille="grande" onClick={creer} disabled={prenom.trim().length === 0}>
            C’est parti&nbsp;!
          </Touche>
        </div>
      ) : (
        <div
          className="grid w-full gap-bloc"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(7rem, 1fr))' }}
        >
          {profils.map((profil) => (
            <button
              key={profil.id}
              type="button"
              onClick={() => onChoisi(profil)}
              className="animate-apparition grid justify-items-center gap-1 rounded-touche bg-surface px-bloc py-bloc shadow-halo transition-transform duration-100 active:scale-[0.97]"
            >
              <span className="text-5xl leading-none">{profil.avatar}</span>
              <span className="text-lg text-encre">{profil.prenom}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCreation(true)}
            aria-label="ajouter un profil"
            className="grid place-items-center rounded-touche border-4 border-dashed border-craie-creuse px-bloc py-bloc text-encre-douce transition-transform active:scale-95"
          >
            {/* Un tracé plutôt que le caractère « ＋ », qui n'est pas centré
                dans sa boîte de glyphe. */}
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="size-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      )}
    </main>
  )
}
