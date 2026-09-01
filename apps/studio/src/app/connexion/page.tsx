'use client'

import { useActionState } from 'react'
import { seConnecter } from './actions.js'

export default function Connexion() {
  const [erreur, action, enCours] = useActionState(seConnecter, null)
  return (
    <main style={{ padding: 24, maxWidth: 360 }}>
      <h1>Studio Awal</h1>
      <form action={action}>
        <input
          type="password"
          name="motDePasse"
          placeholder="Mot de passe"
          autoFocus
          style={{ width: '100%', padding: 8, fontSize: 16 }}
        />
        <button type="submit" disabled={enCours} style={{ marginTop: 12, padding: '8px 16px' }}>
          Entrer
        </button>
      </form>
      {erreur ? <p style={{ color: '#c0392b' }}>{erreur}</p> : null}
    </main>
  )
}
