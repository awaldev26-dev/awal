'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db/index.js'
import { entrees, publications, themes } from '@/db/schema.js'
import { creerStockage } from '@/stockage/index.js'
import { construireArtefact } from '@/publication/construire.js'
import { publierArtefact, type ResultatPublication } from '@/publication/publier.js'

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
  const [lignes, listeThemes, derniere] = await Promise.all([
    db.select().from(entrees),
    db.select().from(themes),
    db.select().from(publications),
  ])
  const version = Math.max(0, ...derniere.map((p) => p.version)) + 1
  const stockage = creerStockage()

  const publiables = lignes.filter((ligne) => ligne.audio !== null)
  if (publiables.length === 0) {
    return { ok: false, problemes: [{ code: 'audio-absent', message: 'Aucune entrée enregistrée.' }] }
  }

  const artefact = construireArtefact(publiables, listeThemes, {
    version,
    publieLe: new Date(),
    urlBaseAudio: stockage.urlPublique(),
  })

  const resultat = await publierArtefact(artefact, stockage)
  if (resultat.ok) {
    await db.insert(publications).values({ version, nbEntrees: publiables.length })
    revalidatePath('/')
  }
  return resultat
}
