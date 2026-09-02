const CACHE = 'awal-v3'

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/'])))
  self.skipWaiting()
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((nom) => nom !== CACHE).map((nom) => caches.delete(nom))),
    ),
  )
  self.clients.claim()
})

function mettreEnCache(requete, reponse) {
  if (!reponse.ok) return
  const copie = reponse.clone()
  caches.open(CACHE).then((cache) => cache.put(requete, copie))
}

/**
 * Seules les ressources dont l'URL ne change jamais de contenu peuvent être
 * servies depuis le cache sans vérifier le réseau : les audios, et les fichiers
 * de Next dont le nom porte une empreinte.
 *
 * Tout le reste — la page elle-même et le corpus publié — passe par le réseau
 * d'abord. En « cache d'abord », ni un nouvel enregistrement ni une correction
 * de l'application ne parviendraient jamais à l'enfant : l'app resterait figée
 * dans la version du premier lancement.
 */
function estImmuable(chemin) {
  return chemin.includes('/audio/') || chemin.startsWith('/_next/static/')
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  const chemin = new URL(requete.url).pathname

  if (estImmuable(chemin)) {
    evenement.respondWith(
      caches.match(requete).then((enCache) => {
        if (enCache) return enCache
        return fetch(requete).then((reponse) => {
          mettreEnCache(requete, reponse)
          return reponse
        })
      }),
    )
    return
  }

  // Réseau d'abord, cache en secours : c'est le cache qui permet de jouer
  // hors ligne, pas de figer l'application.
  evenement.respondWith(
    fetch(requete)
      .then((reponse) => {
        mettreEnCache(requete, reponse)
        return reponse
      })
      .catch(() =>
        caches.match(requete).then((enCache) =>
          enCache ?? new Response('hors ligne', { status: 503 }),
        ),
      ),
  )
})
