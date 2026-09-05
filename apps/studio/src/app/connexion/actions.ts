'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NOM_COOKIE, creerSession } from '@/auth/session'
import { verifier } from '@/auth/motDePasse'

export async function seConnecter(_etat: string | null, donnees: FormData): Promise<string | null> {
  const empreinte = process.env.STUDIO_MOT_DE_PASSE_HACHE
  if (!empreinte) {
    return 'STUDIO_MOT_DE_PASSE_HACHE n’est pas configurée. Voir seed/hacher.ts.'
  }

  // La vérification prend volontairement une centaine de millisecondes :
  // c'est ce qui rend le bourrinage impraticable, faute de limitation de
  // tentatives.
  if (!(await verifier(String(donnees.get('motDePasse') ?? ''), empreinte))) {
    return 'Mot de passe incorrect.'
  }

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
