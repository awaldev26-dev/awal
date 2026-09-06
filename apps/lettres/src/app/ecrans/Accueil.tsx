'use client'

import { Touche } from '@/interface/Touche'

/**
 * Accueil.
 *
 * Deux touches, et rien d'autre. Le pictogramme porte le sens, le mot n'est là
 * que pour l'adulte qui passe derrière : à trois ans, elle reconnaîtra la
 * position et la couleur bien avant de lire.
 */
export function Accueil({
  onExplorer,
  onTrouver,
  paroleMuette,
}: {
  onExplorer: () => void
  onTrouver: () => void
  paroleMuette: boolean
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-large px-bloc py-large">
      <h1 className="text-4xl font-bold text-encre">Les lettres</h1>

      <div className="flex w-full flex-col gap-bloc">
        <Touche ton="accent" onClick={onExplorer} className="animate-flotte w-full py-large">
          <span className="block text-6xl leading-none">A B C</span>
          <span className="mt-2 block text-xl font-medium">Écouter les lettres</span>
        </Touche>

        <Touche ton="joie" onClick={onTrouver} className="w-full py-large">
          <span className="block text-6xl leading-none">👂</span>
          <span className="mt-2 block text-xl font-medium">Trouve la lettre</span>
        </Touche>
      </div>

      {paroleMuette ? (
        // Adressé au parent : elle ne lit pas, et c'est lui qui peut installer
        // une voix française sur l'appareil.
        <p className="max-w-sm rounded-touche bg-surface px-bloc py-carte text-center text-sm text-encre-douce shadow-halo">
          Aucune voix française n’est installée sur cet appareil : les lettres
          s’affichent mais ne se prononcent pas.
        </p>
      ) : null}
    </main>
  )
}
