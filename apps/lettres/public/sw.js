const CACHE = 'lettres-v1'

/**
 * Toutes les routes de l'application.
 *
 * La navigation étant côté client, le HTML de ces pages n'est jamais demandé en
 * usage normal — donc jamais mis en cache. Sans ce préchargement, recharger
 * hors ligne sur autre chose que la racine échouerait.
 */
const ROUTES = ['/', '/explorer', '/trouver']

/**
 * Découvre les fichiers compilés en lisant le HTML des routes.
 *
 * Leurs noms portent une empreinte inconnue à l'écriture de ce fichier. Les
 * injecter après le build ne marche pas : l'hébergeur sert le service worker
 * tel qu'il est dans public/, pas la copie modifiée dans out/. Lire le HTML
 * rend le préchargement indépendant du pipeline de déploiement.
 *
 * Sans ces fichiers, une route jamais visitée en ligne resterait inutilisable
 * hors ligne — son HTML serait en cache, mais pas le script qui la fait vivre.
 */
async function decouvrirStatiques(routes) {
  const trouves = new Set()

  await Promise.all(
    routes.map(async (route) => {
      try {
        const reponse = await fetch(route, { cache: 'no-cache' })
        if (!reponse.ok) return
        const html = await reponse.text()
        for (const trouve of html.matchAll(/["'](\/_next\/static\/[^"']+)["']/g)) {
          trouves.add(trouve[1])
        }
      } catch {
        // Hors ligne à l'installation : on se contentera de ce qu'on a.
      }
    }),
  )

  // Les polices ne figurent pas dans le HTML mais dans les url() des feuilles
  // de style. Sans elles, la première ouverture hors ligne s'afficherait dans
  // la police de secours du système — et la forme des lettres est ici le sujet
  // même de l'application.
  const feuilles = [...trouves].filter((url) => url.endsWith('.css'))
  await Promise.all(
    feuilles.map(async (feuille) => {
      try {
        const reponse = await fetch(feuille, { cache: 'no-cache' })
        if (!reponse.ok) return
        const css = await reponse.text()
        for (const trouve of css.matchAll(/url\(\s*["']?(\/_next\/static\/[^"')]+)["']?\s*\)/g)) {
          trouves.add(trouve[1])
        }
      } catch {
        // Idem : l'absence de réseau ne doit pas empêcher l'installation.
      }
    }),
  )

  return [...trouves]
}

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      const statiques = await decouvrirStatiques(ROUTES)
      // Une par une plutôt qu'addAll : un échec isolé ne doit pas faire
      // capoter l'installation entière du service worker.
      await Promise.all(
        [...ROUTES, ...statiques].map((url) => cache.add(url).catch(() => undefined)),
      )
    })(),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) =>
        Promise.all(noms.filter((nom) => nom !== CACHE).map((nom) => caches.delete(nom))),
      ),
  )
  self.clients.claim()
})

/**
 * Deux stratégies suffisent, là où l'app enfant en demande trois.
 *
 * Il n'y a ici aucun contenu distant : la voix est synthétisée sur l'appareil
 * et les 26 lettres sont compilées dans le script. Rien n'a de fraîcheur à
 * surveiller, donc rien ne justifie d'aller au réseau d'abord.
 */
function estImmuable(chemin) {
  // Les fichiers de Next portent une empreinte dans leur nom : leur URL
  // garantit leur contenu, on peut les servir sans jamais vérifier.
  return chemin.startsWith('/_next/static/')
}

async function cacheDAbord(requete) {
  const enCache = await caches.match(requete)
  if (enCache) return enCache

  const reponse = await fetch(requete)
  if (reponse.ok) {
    const copie = reponse.clone()
    caches.open(CACHE).then((cache) => cache.put(requete, copie))
  }
  return reponse
}

/**
 * Cache d'abord, réseau ensuite pour rafraîchir.
 *
 * `ignoreSearch` parce que la navigation ajoute parfois des paramètres qui ne
 * changent pas le document servi : sans cela, `/trouver?x=1` manquerait le
 * `/trouver` mis en cache et échouerait hors ligne.
 */
async function cachePuisReseau(requete) {
  const enCache = await caches.match(requete, { ignoreSearch: true })

  const rafraichir = fetch(requete)
    .then((reponse) => {
      if (reponse.ok) {
        const copie = reponse.clone()
        caches.open(CACHE).then((cache) => cache.put(requete, copie))
      }
      return reponse
    })
    .catch(() => null)

  if (enCache) return enCache
  const reponse = await rafraichir
  // Dernier recours : la racine est toujours en cache, mieux vaut l'accueil
  // qu'une page d'erreur du navigateur.
  return reponse ?? (await caches.match('/')) ?? Response.error()
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  const url = new URL(requete.url)
  // On ne touche pas aux autres origines : il n'y en a aucune ici, et servir
  // une réponse opaque depuis le cache produirait des erreurs muettes.
  if (url.origin !== self.location.origin) return

  evenement.respondWith(
    estImmuable(url.pathname) ? cacheDAbord(requete) : cachePuisReseau(requete),
  )
})
