'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db/index.js'
import { entrees } from '@/db/schema.js'
import { creerStockage } from '@/stockage/index.js'
import { publierDepuisBase } from '@/publication/depuisBase.js'
import type { ResultatPublication } from '@/publication/publier.js'

export async function enregistrerEntree(donnees: FormData): Promise<void> {
  const id = String(donnees.get('id'))
  await db
    .update(entrees)
    .set({
      kabyle: String(donnees.get('kabyle')).trim(),
      fr: String(donnees.get('fr')).trim(),
      pluriel: String(donnees.get('pluriel') ?? '').trim() || null,
      notes: String(donnees.get('notes') ?? '').trim(),
      niveau: Number(donnees.get('niveau') ?? 1),
      aValider: donnees.get('aValider') === 'on',
    })
    .where(eq(entrees.id, id))
  revalidatePath('/entrees')
  revalidatePath(`/entrees/${id}`)
}

export async function televerserAudio(id: string, fichier: File): Promise<{ cle: string }> {
  const extension = fichier.type.includes('mp4') ? 'mp4' : 'webm'
  const cle = `audio/${id}.${extension}`
  const stockage = creerStockage()
  await stockage.ecrire(cle, new Uint8Array(await fichier.arrayBuffer()), fichier.type)
  await db.update(entrees).set({ audio: cle }).where(eq(entrees.id, id))
  revalidatePath('/entrees')
  revalidatePath(`/entrees/${id}`)
  return { cle }
}

export async function lancerPublication(): Promise<ResultatPublication> {
  const resultat = await publierDepuisBase()
  if (resultat.ok) revalidatePath('/')
  return resultat
}
