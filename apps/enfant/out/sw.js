const CACHE = 'awal-v1'

// L'app shell est mise en cache à l'installation ; les audios le sont à la demande,
// puisqu'on ne connaît pas leurs URL avant d'avoir lu le corpus.
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

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  // Cache d'abord : un enfant hors ligne doit pouvoir jouer,
  // et un audio déjà entendu ne doit jamais être retéléchargé.
  evenement.respondWith(
    caches.match(requete).then((enCache) => {
      if (enCache) return enCache
      return fetch(requete).then((reponse) => {
        if (reponse.ok && (requete.url.includes('/audio/') || requete.url.includes('/corpus/'))) {
          const copie = reponse.clone()
          caches.open(CACHE).then((cache) => cache.put(requete, copie))
        }
        return reponse
      })
    }),
  )
})
