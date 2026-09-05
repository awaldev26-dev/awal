'use server'

import { revalidatePath } from 'next/cache'
import { pictoValide } from '@awal/corpus'
import { exigerSession } from '@/auth/garde'
import { modifierEntree } from '@/depot/depot'
import { publierDepuisDepot } from '@/publication/depuisDepot'
import type { ResultatPublication } from '@/publication/publier'
import { creerStockage } from '@/stockage/index'

/** Une seule page : la rafraîchir suffit à refléter toute modification. */
function rafraichir() {
  revalidatePath('/')
}

export async function enregistrerEntree(donnees: FormData): Promise<void> {
  await exigerSession()
  const id = String(donnees.get('id'))
  await modifierEntree(creerStockage(), id, (courante) => ({
    ...courante,
    kabyle: String(donnees.get('kabyle')).trim(),
    fr: String(donnees.get('fr')).trim(),
    pluriel: String(donnees.get('pluriel') ?? '').trim() || null,
    notes: String(donnees.get('notes') ?? '').trim(),
    niveau: Number(donnees.get('niveau') ?? 1),
    aValider: donnees.get('aValider') === 'on',
  }))
  rafraichir()
}

export async function televerserAudio(id: string, fichier: File): Promise<{ cle: string }> {
  await exigerSession()
  const extension = fichier.type.includes('mp4') ? 'mp4' : 'webm'
  const cle = `audio/${id}.${extension}`
  const stockage = creerStockage()

  await stockage.ecrire(cle, new Uint8Array(await fichier.arrayBuffer()), fichier.type)
  await modifierEntree(stockage, id, (courante) => ({ ...courante, audio: cle }))

  rafraichir()
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
  await exigerSession()
  const extension = fichier.type.includes('png') ? 'png' : 'webp'
  const cle = `pictos/${id}.${extension}`
  const stockage = creerStockage()

  await stockage.ecrire(cle, new Uint8Array(await fichier.arrayBuffer()), fichier.type)
  const picto = `image:${cle}`
  await modifierEntree(stockage, id, (courante) => ({ ...courante, picto }))

  rafraichir()
  return { picto }
}

/** Fixe l'illustration à un emoji, saisi au clavier dans le studio. */
export async function definirPictoEmoji(id: string, reference: string): Promise<void> {
  await exigerSession()
  if (!pictoValide(reference)) throw new Error(`Référence de picto invalide : ${reference}`)
  await modifierEntree(creerStockage(), id, (courante) => ({ ...courante, picto: reference }))
  rafraichir()
}

export async function lancerPublication(): Promise<ResultatPublication> {
  await exigerSession()
  const resultat = await publierDepuisDepot()
  if (resultat.ok) rafraichir()
  return resultat
}
