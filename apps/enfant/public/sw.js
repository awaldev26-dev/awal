const CACHE = 'awal-v5'

/** Au-delà, on sert le cache et on laisse la requête finir en arrière-plan. */
const DELAI_RESEAU_MS = 1500

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
  if (!reponse || !reponse.ok) return reponse
  const copie = reponse.clone()
  caches.open(CACHE).then((cache) => cache.put(requete, copie))
  return reponse
}

/**
 * Ressources dont l'URL garantit le contenu : les audios, dont la clé porte
 * l'identifiant de l'entrée, et les fichiers de Next dont le nom porte une
 * empreinte. Elles peuvent être servies depuis le cache sans jamais vérifier.
 */
function estImmuable(chemin) {
  return chemin.includes('/audio/') || chemin.startsWith('/_next/static/')
}

/** Le corpus publié : c'est le contenu, sa fraîcheur compte. */
function estCorpus(chemin) {
  return chemin.includes('/corpus/')
}

async function cacheDAbord(requete) {
  const enCache = await caches.match(requete)
  if (enCache) return enCache

  const reponse = await fetch(requete)

  // Un élément <audio> demande souvent un fragment (en-tête Range) et reçoit un
  // 206 Partial Content, que l'API Cache refuse de stocker — silencieusement.
  // On redemande alors la ressource entière, par une requête neuve sans Range.
  if (reponse.status === 206) {
    const cache = await caches.open(CACHE)
    cache.add(new Request(requete.url, { mode: 'cors' })).catch(() => undefined)
    return reponse
  }

  return mettreEnCache(requete, reponse)
}

/**
 * Sert le cache immédiatement et rafraîchit en arrière-plan.
 *
 * Retenu pour la page elle-même : elle ne porte aucun contenu, seulement des
 * références vers des fichiers à empreinte déjà en cache. Un décalage d'une
 * version est donc invisible, tandis que le gain au démarrage est réel — et
 * surtout on ne dépend plus d'un réseau qui peut pendre.
 */
async function cachePuisReseau(requete) {
  const enCache = await caches.match(requete)
  const reseau = fetch(requete)
    .then((reponse) => mettreEnCache(requete, reponse))
    .catch(() => undefined)

  if (enCache) return enCache
  const reponse = await reseau
  return reponse ?? new Response('hors ligne', { status: 503 })
}

/**
 * Privilégie le réseau, mais n'attend pas indéfiniment.
 *
 * Retenu pour le corpus : en servant le cache d'abord, une publication
 * n'atteindrait l'enfant qu'au lancement suivant. Le délai de garde évite
 * l'autre écueil — un réseau joignable mais inutilisable, où `fetch` pend
 * sans jamais répondre et laisse l'écran vide.
 */
async function reseauDAbordAvecDelai(requete) {
  const enCache = await caches.match(requete)

  const reseau = fetch(requete)
    .then((reponse) => mettreEnCache(requete, reponse))
    .catch(() => undefined)

  if (!enCache) {
    const reponse = await reseau
    return reponse ?? new Response('corpus indisponible', { status: 503 })
  }

  const delai = new Promise((resoudre) => setTimeout(() => resoudre(undefined), DELAI_RESEAU_MS))
  const gagnant = await Promise.race([reseau, delai])
  return gagnant ?? enCache
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  const chemin = new URL(requete.url).pathname

  if (estImmuable(chemin)) {
    evenement.respondWith(cacheDAbord(requete))
    return
  }

  if (estCorpus(chemin)) {
    evenement.respondWith(reseauDAbordAvecDelai(requete))
    return
  }

  evenement.respondWith(cachePuisReseau(requete))
})
