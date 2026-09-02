const CACHE = 'awal-v2'

// L'app shell est mise en cache à l'installation ; le reste l'est à la demande,
// puisqu'on ne connaît pas les URL des audios avant d'avoir lu le corpus.
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

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  const chemin = new URL(requete.url).pathname

  // Le corpus change à chaque publication : réseau d'abord, cache en secours.
  // En « cache d'abord », une nouvelle publication ne parviendrait jamais à
  // l'enfant — le fichier est petit, la requête réseau est indolore.
  if (chemin.includes('/corpus/')) {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          mettreEnCache(requete, reponse)
          return reponse
        })
        .catch(() =>
          caches.match(requete).then((enCache) =>
            enCache ?? new Response('corpus indisponible', { status: 503 }),
          ),
        ),
    )
    return
  }

  // Les audios sont immuables et lourds : cache d'abord, et un audio déjà
  // entendu ne doit jamais être retéléchargé.
  evenement.respondWith(
    caches.match(requete).then((enCache) => {
      if (enCache) return enCache
      return fetch(requete).then((reponse) => {
        if (chemin.includes('/audio/')) mettreEnCache(requete, reponse)
        return reponse
      })
    }),
  )
})
