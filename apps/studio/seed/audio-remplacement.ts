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
import { lireDepot, ecrireDepot, modifierEntree } from '../src/depot/depot'
import { creerStockage } from '../src/stockage/index'

const executer = promisify(execFile)
const MARQUE = '-remplacement'
const stockage = creerStockage()

if (process.argv.includes('--purger')) {
  const depot = await lireDepot(stockage)
  const purge = depot.entrees.map((entree) =>
    entree.audio?.includes(MARQUE) ? { ...entree, audio: null } : entree,
  )
  await ecrireDepot(stockage, { ...depot, entrees: purge })
  await rm(join(process.cwd(), process.env.STOCKAGE_DISQUE_RACINE ?? './medias', 'audio'), {
    recursive: true,
    force: true,
  })
  console.log('Audios de remplacement purgés.')
  process.exit(0)
}

const depart = await lireDepot(stockage)
const aFaire = depart.entrees.filter((entree) => entree.audio === null)
console.log(`${aFaire.length} entrées sans audio.`)

const temporaire = join(process.cwd(), '.audio-temp')
await mkdir(temporaire, { recursive: true })

/**
 * Le service de synthèse de macOS se bloque parfois après quelques centaines
 * d'appels consécutifs : « say » ne rend jamais la main. D'où le délai maximal
 * et les tentatives — et une courte pause tous les cinquante appels pour le
 * laisser respirer.
 */
async function synthetiser(texte: string, chemin: string): Promise<boolean> {
  for (let tentative = 1; tentative <= 3; tentative += 1) {
    try {
      // LEI16@22050 : WAV mono lisible directement par les navigateurs, sans ffmpeg.
      await executer(
        'say',
        ['-v', 'Thomas', '-r', '140', '-o', chemin, '--data-format=LEI16@22050', texte],
        { timeout: 15_000, killSignal: 'SIGKILL' },
      )
      return true
    } catch {
      await new Promise((resoudre) => setTimeout(resoudre, 1_000 * tentative))
    }
  }
  return false
}

let faits = 0
const echecs: string[] = []
for (const entree of aFaire) {
  const chemin = join(temporaire, `${entree.id}.wav`)
  if (!(await synthetiser(entree.kabyle, chemin))) {
    echecs.push(entree.id)
    continue
  }

  const cle = `audio/${entree.id}${MARQUE}.wav`
  await stockage.ecrire(cle, new Uint8Array(await readFile(chemin)), 'audio/wav')
  await modifierEntree(stockage, entree.id, (courante) => ({ ...courante, audio: cle }))

  faits += 1
  if (faits % 25 === 0) {
    console.log(`  ${faits}/${aFaire.length}`)
    await new Promise((resoudre) => setTimeout(resoudre, 1_500))
  }
}

if (echecs.length > 0) {
  console.log(`${echecs.length} échec(s), relancer le script les reprendra : ${echecs.join(', ')}`)
}

await rm(temporaire, { recursive: true, force: true })
console.log(`${faits} audios de remplacement générés.`)
process.exit(0)
