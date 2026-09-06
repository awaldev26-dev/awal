/**
 * Parole synthétique, en français.
 *
 * C'est ce qui rend cette application possible sans enregistrer une seule voix :
 * le français est bien servi par les moteurs intégrés, contrairement au kabyle
 * d'Awal.
 *
 * Six pièges, tous rencontrés pour de vrai, aucun théorique :
 *
 * 1. `getVoices()` renvoie une liste vide au premier appel sur Chrome, les voix
 *    arrivant de façon asynchrone. On attend `voiceschanged`, avec un délai de
 *    garde : certains moteurs n'émettent jamais cet événement, et attendre
 *    indéfiniment rendrait l'application muette.
 * 2. iOS exige que la première parole descende d'un geste utilisateur. C'est
 *    naturel ici, rien ne parlant sans qu'on touche une lettre.
 * 3. Les voix réseau introduisent une latence qu'une enfant de trois ans ne
 *    tolère pas. On préfère donc une voix locale.
 * 4. Elle va marteler l'écran. Empiler les paroles produirait une file qui
 *    continue longtemps après le dernier appui : on coupe avant de parler.
 * 5. Mais `cancel()` est asynchrone. Enchaîner `cancel()` puis `speak()` laisse
 *    l'annulation atterrir après la mise en file et tuer la parole qu'on vient
 *    de demander. On lui laisse donc le temps d'agir, et l'on ne coupe que s'il
 *    y a quelque chose à couper — une annulation gratuite est précisément ce
 *    qui bloque le moteur.
 * 6. Chrome se bloque malgré tout : `speaking` reste vrai et le `speak()`
 *    suivant n'émet ni début, ni fin, ni erreur. Aucun code ne peut l'éviter,
 *    seulement le détecter — d'où le filet qui débloque et réessaie une fois.
 *
 * Ce module a été mis au point contre un vrai navigateur, en instrumentant
 * `speak` et `cancel`. Le raisonnement seul menait à un écran muet.
 */

/** Débit un peu ralenti : plus lisible pour une petite oreille. */
const DEBIT = 0.85

/** Au-delà, on renonce à attendre la liste des voix et on parle avec le défaut. */
const ATTENTE_VOIX_MS = 1500

/** Répit laissé à l'annulation pour agir. Imperceptible à l'appui. */
const REPIT_ANNULATION_MS = 80

/** Sans début passé ce délai, on tient le moteur pour bloqué. */
const DELAI_DEMARRAGE_MS = 500

let voixChoisie: SpeechSynthesisVoice | null = null
let voixCherchee = false

/** Numéro de la dernière parole demandée, pour abandonner celles supplantées. */
let jeton = 0

const pause = (ms: number) => new Promise((resoudre) => setTimeout(resoudre, ms))

/**
 * Vrai si l'appareil sait parler.
 *
 * On éprouve les fonctions elles-mêmes plutôt que la présence des noms :
 * `'speechSynthesis' in window` répond vrai quand la propriété existe mais
 * vaut `undefined`, ce qui arrive derrière certaines extensions et sur des
 * navigateurs bridés. On croyait alors pouvoir parler, et l'appel suivant
 * levait une exception qui avalait la promesse — ni parole, ni message au
 * parent, et un plantage au premier appui.
 */
export function disponible(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
}

/** Quelque chose est en cours ou en attente. */
function occupe(): boolean {
  return speechSynthesis.speaking || speechSynthesis.pending
}

/**
 * Coupe ce qui parle, et rien d'autre.
 *
 * Le garde-fou n'est pas cosmétique : ce sont les annulations émises alors que
 * rien ne parlait qui bloquaient le moteur. À l'ouverture de l'écran, trois
 * annulations gratuites suffisaient à rendre muette la parole suivante.
 *
 * `resume()` accompagne l'annulation : Chrome se met parfois en pause interne,
 * et c'est ce qui le remet en marche.
 */
function couper(): void {
  if (!occupe()) return
  speechSynthesis.cancel()
  speechSynthesis.resume()
}

/**
 * Attend que la liste des voix soit peuplée.
 *
 * Résout avec la liste, éventuellement vide : une liste vide ne veut pas dire
 * qu'on ne peut pas parler, le moteur ayant toujours une voix par défaut.
 */
function attendreVoix(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resoudre) => {
    const immediat = speechSynthesis.getVoices()
    if (immediat.length > 0) return resoudre(immediat)

    let fini = false
    const terminer = () => {
      if (fini) return
      fini = true
      speechSynthesis.removeEventListener('voiceschanged', terminer)
      resoudre(speechSynthesis.getVoices())
    }

    speechSynthesis.addEventListener('voiceschanged', terminer)
    setTimeout(terminer, ATTENTE_VOIX_MS)
  })
}

/**
 * Choisit la meilleure voix française disponible, sans rien prononcer.
 *
 * Priorité au français de France, puis à une voix locale : une voix réseau
 * ajoute une demi-seconde entre le doigt et le son, ce qui suffit à casser le
 * lien de cause à effet pour une enfant de cet âge.
 *
 * Renvoie null s'il n'existe aucune voix française : l'appelant en informe
 * alors le parent.
 */
export async function trouverVoix(): Promise<SpeechSynthesisVoice | null> {
  if (voixCherchee) return voixChoisie
  voixCherchee = true

  const toutes = await attendreVoix()
  const francaises = toutes.filter((voix) => voix.lang.toLowerCase().startsWith('fr'))
  if (francaises.length === 0) return (voixChoisie = null)

  const deFrance = francaises.filter(
    (voix) => voix.lang.toLowerCase().replace('_', '-') === 'fr-fr',
  )
  const candidates = deFrance.length > 0 ? deFrance : francaises

  voixChoisie = candidates.find((voix) => voix.localService) ?? candidates[0] ?? null
  return voixChoisie
}

/** Ce qu'une tentative de parole a produit. */
type Issue = 'dite' | 'bloquee'

/**
 * Prononce une fois, et rapporte si le moteur a démarré.
 *
 * Le filet de démarrage est la seule façon de repérer un moteur bloqué : dans
 * cet état, `speak()` n'émet ni début, ni fin, ni erreur, et l'on attendrait
 * indéfiniment une promesse qui ne se résout jamais.
 */
function prononcer(texte: string, voix: SpeechSynthesisVoice | null): Promise<Issue> {
  return new Promise<Issue>((resoudre) => {
    const enonce = new SpeechSynthesisUtterance(texte)
    enonce.lang = voix?.lang ?? 'fr-FR'
    if (voix) enonce.voice = voix
    enonce.rate = DEBIT

    let demarre = false
    let fini = false
    const terminer = (issue: Issue) => {
      if (fini) return
      fini = true
      resoudre(issue)
    }

    enonce.onstart = () => {
      demarre = true
    }
    enonce.onend = () => terminer('dite')
    // Une parole coupée déclenche `onerror` : c'est le cas normal quand on
    // touche une lettre pendant qu'une autre parle, pas une anomalie.
    enonce.onerror = () => terminer('dite')

    speechSynthesis.speak(enonce)
    setTimeout(() => {
      if (!demarre) terminer('bloquee')
    }, DELAI_DEMARRAGE_MS)
  })
}

/**
 * Prononce un texte, en coupant ce qui était en cours.
 *
 * Ne rejette jamais : une parole ratée ne doit pas casser l'écran. Résout à la
 * fin de la parole, ou tout de suite si l'appareil ne parle pas — l'appelant
 * peut ainsi enchaîner sans se soucier du cas dégradé.
 */
export async function dire(texte: string): Promise<void> {
  // Une chaîne vide produit un énoncé fantôme : il n'émet ni début ni fin sur
  // plusieurs moteurs, et laisse `speaking` à vrai, ce qui coince la suite.
  if (!disponible() || texte.trim() === '') return

  const mien = ++jeton
  let voix: SpeechSynthesisVoice | null = null
  try {
    voix = await trouverVoix()
    if (occupe()) {
      couper()
      await pause(REPIT_ANNULATION_MS)
    }
  } catch {
    // Un moteur qui lève plutôt que de refuser proprement ne doit pas empêcher
    // l'écran de fonctionner : les lettres restent regardables.
    return
  }

  // Supplantée pendant le répit : c'est la plus récente qui doit s'entendre.
  if (mien !== jeton) return

  if ((await prononcer(texte, voix)) === 'dite') return
  if (mien !== jeton) return

  // Une seule reprise. Si le déblocage ne suffit pas, insister n'empilerait que
  // des tentatives muettes.
  speechSynthesis.cancel()
  speechSynthesis.resume()
  await pause(REPIT_ANNULATION_MS)
  if (mien !== jeton) return
  await prononcer(texte, voix)
}

/**
 * Coupe la parole. À appeler en quittant un écran.
 *
 * Incrémente le jeton : une parole encore dans son répit sera abandonnée au
 * lieu de se déclencher par-dessus l'écran suivant.
 */
export function taire(): void {
  jeton += 1
  if (disponible()) couper()
}
