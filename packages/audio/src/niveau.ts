/**
 * Mesure et mise à niveau d'une prise de voix.
 *
 * Partagé par le studio et l'app enfant, et c'est tout l'intérêt : l'Écho fait
 * entendre la voix du père puis celle de l'enfant, et la comparaison ne porte
 * sur la prononciation que si les deux visent le même niveau. Deux constantes
 * écrites en double auraient dérivé un jour sans que rien ne le signale, et
 * l'exercice se serait mis à comparer des volumes.
 *
 * Ce module ne connaît rien du Web Audio : il travaille sur des Float32Array,
 * donc il est mesurable hors navigateur — là où vivent les cas limites.
 */

/**
 * Niveau visé, en amplitude efficace. C'est lui qui rend toutes les prises
 * égales entre elles : normaliser la crête ne suffirait pas, deux prises de
 * même crête pouvant être perçues à des volumes très différents.
 */
export const CIBLE_EFFICACE = 0.1

/** La crête ne doit jamais atteindre 1, sous peine de saturation à la lecture. */
export const PLAFOND_CRETE = 0.89

/** Sans plafond, une prise quasi muette verrait son seul souffle amplifié. */
export const GAIN_MAX = 8

/** Fenêtre d'analyse du silence. Assez courte pour être précise, assez longue
 *  pour qu'un claquement isolé ne passe pas pour de la parole. */
const FENETRE_MS = 5

/** Un seuil relatif à la crête : une prise douce ne doit pas être prise pour du silence. */
const SEUIL_RELATIF = 0.04

/** Plancher absolu, pour qu'une prise entièrement muette ne s'auto-justifie pas. */
const SEUIL_PLANCHER = 0.004

/** Marges conservées autour du mot : l'attaque et l'extinction en font partie. */
const MARGE_AVANT_MS = 30
const MARGE_APRES_MS = 120

/**
 * Bornes du son utile, en index d'échantillons.
 *
 * Renvoie l'intervalle complet si aucune fenêtre ne dépasse le seuil : mieux
 * vaut livrer une prise muette telle quelle que de la réduire à néant, car
 * c'est en l'écoutant qu'on comprend que le micro n'a rien capté.
 */
export function bornesUtiles(
  echantillons: Float32Array,
  frequence: number,
): { debut: number; fin: number } {
  const total = echantillons.length
  if (total === 0) return { debut: 0, fin: 0 }

  let crete = 0
  for (let i = 0; i < total; i += 1) {
    const valeur = Math.abs(echantillons[i] ?? 0)
    if (valeur > crete) crete = valeur
  }

  const seuil = Math.max(crete * SEUIL_RELATIF, SEUIL_PLANCHER)
  const fenetre = Math.max(1, Math.round((FENETRE_MS / 1000) * frequence))

  let premiere = -1
  let derniere = -1
  for (let depart = 0; depart < total; depart += fenetre) {
    const arret = Math.min(depart + fenetre, total)
    let somme = 0
    for (let i = depart; i < arret; i += 1) {
      const valeur = echantillons[i] ?? 0
      somme += valeur * valeur
    }
    if (Math.sqrt(somme / (arret - depart)) >= seuil) {
      if (premiere === -1) premiere = depart
      derniere = arret
    }
  }

  if (premiere === -1) return { debut: 0, fin: total }

  const margeAvant = Math.round((MARGE_AVANT_MS / 1000) * frequence)
  const margeApres = Math.round((MARGE_APRES_MS / 1000) * frequence)
  return {
    debut: Math.max(0, premiere - margeAvant),
    fin: Math.min(total, derniere + margeApres),
  }
}

/**
 * Gain à appliquer pour amener la prise au niveau visé.
 *
 * Le niveau efficace commande, la crête ne fait que brider : c'est ainsi que
 * deux prises finissent au même volume perçu sans qu'une seule sature.
 */
export function gainNormalisation(echantillons: Float32Array): number {
  const total = echantillons.length
  if (total === 0) return 1

  let somme = 0
  let crete = 0
  for (let i = 0; i < total; i += 1) {
    const valeur = echantillons[i] ?? 0
    somme += valeur * valeur
    const absolue = Math.abs(valeur)
    if (absolue > crete) crete = absolue
  }

  const efficace = Math.sqrt(somme / total)
  if (efficace === 0 || crete === 0) return 1

  return Math.min(CIBLE_EFFICACE / efficace, PLAFOND_CRETE / crete, GAIN_MAX)
}

/** Durée des fondus aux extrémités : une coupe franche produit un clic audible. */
export const FONDU_MS = 8

/**
 * Recopie la partie utile en l'amenant au niveau visé, fondus compris.
 *
 * Travaille de Float32Array à Float32Array pour rester hors du navigateur :
 * c'est à l'appelant de fournir un tampon de la bonne longueur, obtenue par
 * `bornesUtiles`.
 */
export function appliquer(
  utile: Float32Array,
  sortie: Float32Array,
  frequence: number,
): void {
  const gain = gainNormalisation(utile)
  const fondu = Math.min(
    Math.round((FONDU_MS / 1000) * frequence),
    Math.floor(utile.length / 2),
  )

  for (let i = 0; i < utile.length; i += 1) {
    let valeur = (utile[i] ?? 0) * gain
    if (fondu > 0) {
      if (i < fondu) valeur *= i / fondu
      else if (i >= utile.length - fondu) valeur *= (utile.length - i) / fondu
    }
    sortie[i] = valeur
  }
}
