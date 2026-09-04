/**
 * Injecte la liste des fichiers statiques dans le service worker, après le build.
 *
 * Les noms de ces fichiers portent une empreinte inconnue avant la compilation :
 * le service worker ne peut donc pas les énumérer lui-même. Sans ce
 * préchargement, une route jamais visitée en ligne reste inaccessible hors
 * ligne — son HTML est en cache, mais pas le script qui la fait vivre.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const racine = new URL('../apps/enfant/out', import.meta.url).pathname
const statique = join(racine, '_next', 'static')

function parcourir(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    return statSync(chemin).isDirectory() ? parcourir(chemin) : [chemin]
  })
}

if (!existsSync(statique)) {
  console.error(
    `Dossier introuvable : ${statique}\n` +
      `Le build a-t-il bien produit son export statique dans « out/ » ?\n` +
      `Ce script doit tourner après « next build », depuis le dossier de l'app.`,
  )
  process.exit(1)
}

const fichiers = parcourir(statique)
  // Les polices comptent autant que le script : sans elles, la première
  // ouverture hors ligne s'afficherait dans la police de secours du système.
  .filter((chemin) => /\.(js|css|woff2?)$/.test(chemin))
  .map((chemin) => '/' + relative(racine, chemin))
  .sort()

const cheminSw = join(racine, 'sw.js')
const sw = readFileSync(cheminSw, 'utf8')
const remplace = sw.replace(
  /const STATIQUES = \[\][^\n]*/,
  `const STATIQUES = ${JSON.stringify(fichiers)}`,
)

if (remplace === sw) {
  console.error('Marqueur « const STATIQUES = [] » introuvable dans sw.js.')
  process.exit(1)
}

writeFileSync(cheminSw, remplace)
const poids = fichiers.reduce((total, f) => total + statSync(join(racine, f)).size, 0)
console.log(`${fichiers.length} fichiers statiques préchargés (${Math.round(poids / 1024)} Ko)`)
