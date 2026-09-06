/**
 * Parole synthétique, en français.
 *
 * C'est ce qui rend cette application possible sans enregistrer une seule voix :
 * le français est bien servi par les moteurs intégrés, contrairement au kabyle
 * d'Awal.
 *
 * Quatre pièges, chacun traité ici, et aucun n'est théorique :
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
 *    continue longtemps après le dernier appui ; on annule la parole en cours
 *    avant chaque nouvelle, pour que la dernière lettre touchée soit celle
 *    qu'on entend.
 */

/** Débit un peu ralenti : plus lisible pour une petite oreille. */
const DEBIT = 0.85

/** Au-delà, on renonce à attendre la liste des voix et on parle avec le défaut. */
const ATTENTE_VOIX_MS = 1500

let voixChoisie: SpeechSynthesisVoice | null = null
let voixCherchee = false

/**
 * Vrai si l'appareil sait parler.
 *
 * On éprouve les fonctions elles-mêmes plutôt que la présence des noms :
 * `'speechSynthesis' in window` répond vrai quand la propriété existe mais
 * vaut `undefined`, ce qui arrive derrière certaines extensions et sur des
 * navigateurs bridés. On croyait alors pouvoir parler, et l'appel suivant
 * levait une exception qui avalait la promesse — ni parole, ni message, et un
 * plantage au premier appui.
 */
export function disponible(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
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
 * Choisit la meilleure voix française disponible.
 *
 * Priorité au français de France, puis à une voix locale : une voix réseau
 * ajoute une demi-seconde entre le doigt et le son, ce qui suffit à casser le
 * lien de cause à effet pour une enfant de cet âge.
 *
 * Renvoie null s'il n'existe aucune voix française : l'appelant en informe
 * alors le parent.
 */
async function trouverVoix(): Promise<SpeechSynthesisVoice | null> {
  if (voixCherchee) return voixChoisie
  voixCherchee = true

  const toutes = await attendreVoix()
  const francaises = toutes.filter((voix) => voix.lang.toLowerCase().startsWith('fr'))
  if (francaises.length === 0) return (voixChoisie = null)

  const deFrance = francaises.filter((voix) => voix.lang.toLowerCase().replace('_', '-') === 'fr-fr')
  const candidates = deFrance.length > 0 ? deFrance : francaises

  voixChoisie = candidates.find((voix) => voix.localService) ?? candidates[0] ?? null
  return voixChoisie
}

/**
 * Vrai si une voix française a été trouvée.
 *
 * À n'appeler qu'après une première tentative de parole : avant, la liste des
 * voix n'est pas encore connue et la réponse serait un faux négatif.
 */
export function voixFrancaiseTrouvee(): boolean {
  return voixChoisie !== null
}

/**
 * Prononce un texte, en annulant ce qui était en cours.
 *
 * Ne rejette jamais : une parole ratée ne doit pas casser l'écran. Résout à la
 * fin de la parole, ou tout de suite si l'appareil ne parle pas — l'appelant
 * peut ainsi enchaîner sans se soucier du cas dégradé.
 */
export async function dire(texte: string): Promise<void> {
  if (!disponible()) return

  let voix: SpeechSynthesisVoice | null = null
  try {
    voix = await trouverVoix()
    // Annuler avant de parler : c'est ce qui empêche une file de s'accumuler
    // quand l'écran est martelé.
    speechSynthesis.cancel()
  } catch {
    // Un moteur qui lève plutôt que de refuser proprement ne doit pas empêcher
    // l'écran de fonctionner : les lettres restent regardables.
    return
  }

  return new Promise<void>((resoudre) => {
    const enonce = new SpeechSynthesisUtterance(texte)
    enonce.lang = voix?.lang ?? 'fr-FR'
    if (voix) enonce.voice = voix
    enonce.rate = DEBIT

    let fini = false
    const terminer = () => {
      if (fini) return
      fini = true
      resoudre()
    }

    enonce.onend = terminer
    // Une parole annulée déclenche `onerror` : c'est le cas normal quand on
    // touche une lettre pendant qu'une autre parle, pas une anomalie.
    enonce.onerror = terminer

    speechSynthesis.speak(enonce)
  })
}

/** Coupe la parole. À appeler en quittant un écran. */
export function taire(): void {
  if (disponible()) speechSynthesis.cancel()
}
