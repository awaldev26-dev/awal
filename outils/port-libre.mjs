/**
 * Refuse de construire si un serveur de développement écoute sur le port de
 * l'application.
 *
 * Les deux partagent des caches de compilation ; lancer un build pendant que
 * « next dev » tourne laisse le serveur dans un état incohérent — page sans
 * feuille de style, modules introuvables — et le symptôme ne désigne pas sa
 * cause. C'est arrivé deux fois avant l'ajout de ce garde-fou.
 *
 *   node ../../outils/port-libre.mjs 3002
 */
import { createConnection } from 'node:net'

const port = Number(process.argv[2])
if (!Number.isFinite(port)) {
  console.error('Usage : node outils/port-libre.mjs <port>')
  process.exit(2)
}

const occupe = await new Promise((resoudre) => {
  const prise = createConnection({ port, host: '127.0.0.1' })
  prise.setTimeout(600)
  prise.on('connect', () => {
    prise.destroy()
    resoudre(true)
  })
  prise.on('timeout', () => {
    prise.destroy()
    resoudre(false)
  })
  prise.on('error', () => resoudre(false))
})

if (occupe) {
  console.error(
    `\nUn serveur écoute déjà sur le port ${port}.\n\n` +
      `Construire maintenant corromprait son cache de compilation : la page\n` +
      `perdrait ses styles sans message d'erreur explicite.\n\n` +
      `Arrête le serveur de développement, puis relance le build.\n`,
  )
  process.exit(1)
}
