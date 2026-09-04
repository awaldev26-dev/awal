'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db/index'
import { entrees } from '@/db/schema'
import { creerStockage } from '@/stockage/index'
import { pictoValide } from '@awal/corpus'
import { publierDepuisBase } from '@/publication/depuisBase'
import type { ResultatPublication } from '@/publication/publier'

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

/**
 * Remplace l'illustration d'une entrée par une image.
 *
 * L'image arrive déjà redimensionnée par le navigateur : une photo de
 * téléphone pèse plusieurs mégaoctets, ce qui serait absurde pour une vignette
 * de cent pixels affichée dans une grille.
 */
export async function televerserPicto(id: string, fichier: File): Promise<{ picto: string }> {
  const extension = fichier.type.includes('png') ? 'png' : 'webp'
  const cle = `pictos/${id}.${extension}`
  const stockage = creerStockage()
  await stockage.ecrire(cle, new Uint8Array(await fichier.arrayBuffer()), fichier.type)

  const picto = `image:${cle}`
  await db.update(entrees).set({ picto }).where(eq(entrees.id, id))
  revalidatePath('/')
  return { picto }
}

/** Fixe l'illustration à un emoji, saisi au clavier dans le studio. */
export async function definirPictoEmoji(id: string, reference: string): Promise<void> {
  if (!pictoValide(reference)) throw new Error(`Référence de picto invalide : ${reference}`)
  await db.update(entrees).set({ picto: reference }).where(eq(entrees.id, id))
  revalidatePath('/')
}

export async function lancerPublication(): Promise<ResultatPublication> {
  const resultat = await publierDepuisBase()
  if (resultat.ok) revalidatePath('/')
  return resultat
}
