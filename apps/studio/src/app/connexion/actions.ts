'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NOM_COOKIE, creerSession } from '@/auth/session'

export async function seConnecter(_etat: string | null, donnees: FormData): Promise<string | null> {
  const attendu = process.env.STUDIO_MOT_DE_PASSE
  if (!attendu) return 'STUDIO_MOT_DE_PASSE n’est pas configurée.'
  if (donnees.get('motDePasse') !== attendu) return 'Mot de passe incorrect.'

  const magasin = await cookies()
  magasin.set(NOM_COOKIE, await creerSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect('/')
}
