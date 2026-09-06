'use client'

import { useActionState } from 'react'
import { seConnecter } from './actions'

export default function Connexion() {
  const [erreur, action, enCours] = useActionState(seConnecter, null)

  return (
    <main className="grid min-h-dvh place-items-center bg-fond p-bloc">
      <div className="w-full max-w-sm">
        <div className="mb-section text-center">
          <h1 className="text-2xl font-semibold text-encre">Studio Awal</h1>
          <p className="mt-1 text-sm text-encre-douce">
            Enregistrer et publier le corpus kabyle
          </p>
        </div>

        <form
          action={action}
          className="space-y-bloc rounded-panneau border border-bordure bg-surface p-section shadow-panneau"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium tracking-wide text-encre-douce uppercase">
              Mot de passe
            </span>
            <input
              type="password"
              name="motDePasse"
              autoFocus
              autoComplete="current-password"
              aria-invalid={erreur !== null}
              className="w-full rounded-champ border border-bordure bg-surface px-3 py-2.5 text-base text-encre transition focus:border-accent focus:outline-none md:text-sm aria-[invalid=true]:border-danger"
            />
          </label>

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-champ bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-sombre disabled:opacity-50"
          >
            {/* La vérification prend une centaine de millisecondes : sans ce
                retour, le clic semble n'avoir aucun effet. */}
            {enCours ? 'Vérification…' : 'Entrer'}
          </button>

          {erreur ? (
            <p
              role="alert"
              className="rounded-champ bg-danger-pale px-3 py-2 text-sm text-danger"
            >
              {erreur}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  )
}
