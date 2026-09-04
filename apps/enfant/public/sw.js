const CACHE = 'awal-v9'

/**
 * Toutes les routes de l'application.
 *
 * La navigation étant côté client, le HTML de ces pages n'est jamais demandé
 * en usage normal — donc jamais mis en cache. Sans ce préchargement, recharger
 * hors ligne sur autre chose que la racine échouerait.
 */
const ROUTES = [
  '/',
  '/jouer',
  '/jouer/session',
  '/jouer/bilan',
  '/jouer/collection',
  '/mots',
]

/**
 * Fichiers compilés, injectés après le build par outils/precache.mjs — leurs
 * noms portent une empreinte inconnue à l'écriture de ce fichier. Sans eux,
 * une route jamais visitée en ligne resterait inutilisable hors ligne.
 */
const STATIQUES = []

/** Au-delà, on sert le cache et on laisse la requête finir en arrière-plan. */
const DELAI_RESEAU_MS = 1500

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Une par une plutôt qu'addAll : un échec isolé ne doit pas faire
      // capoter l'installation entière du service worker.
      Promise.all(
        [...ROUTES, ...STATIQUES].map((url) => cache.add(url).catch(() => undefined)),
      ),
    ),
  )
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

  // Deux réponses que l'API Cache refuse de stocker, toutes deux en silence :
  //   — le 206 Partial Content, qu'un <audio> obtient en demandant un fragment ;
  //   — la réponse opaque (type 'opaque', status 0) d'une requête no-cors vers
  //     une autre origine, ce que fait <audio> pour un fichier sur R2.
  //
  // On redemande alors la ressource entière en CORS — la règle du bucket
  // l'autorise — et on sert cette réponse-là plutôt que l'originale : elle est
  // à la fois lisible par l'élément audio et stockable dans le cache.
  if (reponse.status === 206 || reponse.type === 'opaque' || reponse.status === 0) {
    try {
      const complete = await fetch(requete.url, { mode: 'cors' })
      if (complete.ok) return mettreEnCache(new Request(requete.url), complete)
    } catch {
      // Pas de CORS sur cette origine : on se rabat sur la réponse d'origine,
      // jouable mais non mise en cache.
    }
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
  // ignoreSearch : « /mots?theme=les-animaux » doit trouver « /mots » en cache.
  // Le paramètre est lu côté client, le HTML servi est le même.
  const enCache = await caches.match(requete, { ignoreSearch: true })
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
