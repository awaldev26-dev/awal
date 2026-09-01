/**
 * Génère des audios de remplacement pour les entrées sans enregistrement.
 *
 * ATTENTION : c'est une voix française lisant une transcription kabyle.
 * La prononciation est FAUSSE. Ces fichiers servent uniquement à vérifier que
 * la mécanique du jeu fonctionne avant le premier vrai enregistrement, et
 * disparaissent dès que le studio reçoit la voix du père.
 *
 *   pnpm tsx seed/audio-remplacement.ts            # génère les manquants
 *   pnpm tsx seed/audio-remplacement.ts --purger   # efface les remplacements
 */
import { execFile } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { eq, isNull, like } from 'drizzle-orm'
import { db } from '../src/db/index.js'
import { entrees } from '../src/db/schema.js'
import { creerStockage } from '../src/stockage/index.js'

const executer = promisify(execFile)
const MARQUE = '-remplacement'
const stockage = creerStockage()

if (process.argv.includes('--purger')) {
  await db.update(entrees).set({ audio: null }).where(like(entrees.audio, `%${MARQUE}%`))
  await rm(join(process.cwd(), process.env.STOCKAGE_DISQUE_RACINE ?? './medias', 'audio'), {
    recursive: true,
    force: true,
  })
  console.log('Audios de remplacement purgés.')
  process.exit(0)
}

const aFaire = await db.select().from(entrees).where(isNull(entrees.audio))
console.log(`${aFaire.length} entrées sans audio.`)

const temporaire = join(process.cwd(), '.audio-temp')
await mkdir(temporaire, { recursive: true })

let faits = 0
for (const entree of aFaire) {
  const chemin = join(temporaire, `${entree.id}.wav`)
  // LEI16@22050 : WAV mono lisible directement par les navigateurs, sans ffmpeg.
  await executer('say', ['-v', 'Thomas', '-r', '140', '-o', chemin, '--data-format=LEI16@22050', entree.kabyle])

  const cle = `audio/${entree.id}${MARQUE}.wav`
  await stockage.ecrire(cle, new Uint8Array(await readFile(chemin)), 'audio/wav')
  await db.update(entrees).set({ audio: cle }).where(eq(entrees.id, entree.id))

  faits += 1
  if (faits % 25 === 0) console.log(`  ${faits}/${aFaire.length}`)
}

await rm(temporaire, { recursive: true, force: true })
console.log(`${faits} audios de remplacement générés.`)
process.exit(0)
