/**
 * Traitement d'une prise avant envoi.
 *
 * Une prise brute au micro d'un téléphone souffre de trois défauts, et le
 * dernier est le plus pénible à l'usage :
 *
 * — du silence avant et après le mot, qui donne l'impression que l'app rame ;
 * — des grondements sous 80 Hz, que rien ne filtre ;
 * — des niveaux inégaux d'une prise à l'autre, ce qui s'entend bien plus que
 *   le grain de la voix quand on enchaîne vingt cartes.
 *
 * S'y ajoute un travail de timbre volontairement léger : un peu de corps, un
 * peu de présence, une compression modérée. Le but est de flatter la voix,
 * jamais de la déformer — c'est une prononciation à imiter, pas un effet.
 *
 * Tout se passe dans le navigateur : l'hébergement ne fournit pas ffmpeg, et
 * le Web Audio suffit. Les fonctions de calcul pur sont exportées à part,
 * parce que ce sont elles qui portent les cas limites et qu'elles sont les
 * seules qu'on puisse tester hors navigateur.
 */

/** Coupe sous cette fréquence : rien d'utile pour une voix, et les grondements y vivent. */
const COUPURE_GRAVE = 80

/** Corps de la voix. Un gain doux suffit ; au-delà, la prise devient sourde. */
const CORPS_FREQUENCE = 180
const CORPS_GAIN = 2.5

/** Présence : c'est cette bande qui rend nets les gh, kh, th et dh du kabyle. */
const PRESENCE_FREQUENCE = 3200
const PRESENCE_GAIN = 2
const PRESENCE_LARGEUR = 0.9

/** Compression modérée : elle épaissit la voix en resserrant l'écart fort/faible. */
const COMPRESSION = {
  seuil: -22,
  genou: 26,
  rapport: 3.5,
  attaque: 0.004,
  relachement: 0.22,
}

/**
 * Niveau visé, en amplitude efficace. C'est lui qui rend toutes les prises
 * égales entre elles : normaliser la crête ne suffirait pas, deux prises de
 * même crête pouvant être perçues à des volumes très différents.
 */
const CIBLE_EFFICACE = 0.1

/** La crête ne doit jamais atteindre 1, sous peine de saturation à la lecture. */
const PLAFOND_CRETE = 0.89

/** Sans plafond, une prise quasi muette verrait son seul souffle amplifié. */
const GAIN_MAX = 8

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

/** Fondus aux extrémités : une coupe franche produit un clic audible. */
const FONDU_MS = 8

/** Débit de l'encodage. Large pour une voix seule en mono. */
const DEBIT = 48_000

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
 * deux cent quarante-trois prises finissent au même volume perçu sans qu'une
 * seule sature.
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

/**
 * Contraintes de capture.
 *
 * Le gain automatique est écarté : il corrige le niveau en cours de prise, ce
 * qui rend le résultat inégal à l'intérieur d'un même mot et contredit la
 * normalisation appliquée ensuite. L'annulation d'écho l'est aussi — conçue
 * pour la téléphonie, elle dégrade une voix seule. La réduction de bruit,
 * elle, reste utile dans une pièce vivante.
 */
export const CONTRAINTES_MICRO: MediaStreamConstraints = {
  audio: {
    channelCount: 1,
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: true,
  },
}

/** Applique la chaîne de traitement et renvoie les échantillons rendus. */
async function rendre(source: AudioBuffer): Promise<AudioBuffer> {
  // Mono : une voix n'a rien à gagner de deux canaux, et le fichier double.
  // La fréquence d'origine est conservée, un rééchantillonnage ici étant une
  // source connue d'écarts entre navigateurs.
  const contexte = new OfflineAudioContext(1, source.length, source.sampleRate)

  const lecture = contexte.createBufferSource()
  lecture.buffer = source

  const grave = contexte.createBiquadFilter()
  grave.type = 'highpass'
  grave.frequency.value = COUPURE_GRAVE

  const corps = contexte.createBiquadFilter()
  corps.type = 'lowshelf'
  corps.frequency.value = CORPS_FREQUENCE
  corps.gain.value = CORPS_GAIN

  const presence = contexte.createBiquadFilter()
  presence.type = 'peaking'
  presence.frequency.value = PRESENCE_FREQUENCE
  presence.Q.value = PRESENCE_LARGEUR
  presence.gain.value = PRESENCE_GAIN

  const compresseur = contexte.createDynamicsCompressor()
  compresseur.threshold.value = COMPRESSION.seuil
  compresseur.knee.value = COMPRESSION.genou
  compresseur.ratio.value = COMPRESSION.rapport
  compresseur.attack.value = COMPRESSION.attaque
  compresseur.release.value = COMPRESSION.relachement

  lecture.connect(grave)
  grave.connect(corps)
  corps.connect(presence)
  presence.connect(compresseur)
  compresseur.connect(contexte.destination)
  lecture.start()

  return contexte.startRendering()
}

/**
 * Coupe le silence, égalise le niveau et adoucit les extrémités.
 *
 * Dans cet ordre : la normalisation vient après la compression, qui a déjà
 * modifié les niveaux, sinon la mesure porterait sur un signal périmé.
 */
function tailler(rendu: AudioBuffer): AudioBuffer {
  const entree = rendu.getChannelData(0)
  const { debut, fin } = bornesUtiles(entree, rendu.sampleRate)
  const utile = entree.subarray(debut, fin)
  const gain = gainNormalisation(utile)

  const longueur = Math.max(1, utile.length)
  const taille = new AudioBuffer({
    length: longueur,
    numberOfChannels: 1,
    sampleRate: rendu.sampleRate,
  })
  const sortie = taille.getChannelData(0)

  const fondu = Math.min(
    Math.round((FONDU_MS / 1000) * rendu.sampleRate),
    Math.floor(longueur / 2),
  )

  for (let i = 0; i < utile.length; i += 1) {
    let valeur = (utile[i] ?? 0) * gain
    if (fondu > 0) {
      if (i < fondu) valeur *= i / fondu
      else if (i >= utile.length - fondu) valeur *= (utile.length - i) / fondu
    }
    sortie[i] = valeur
  }

  return taille
}

/**
 * Réencode le résultat.
 *
 * Le Web Audio ne sait pas produire de fichier : on rejoue donc le tampon dans
 * un flux que MediaRecorder enregistre. La lecture se fait en temps réel, soit
 * l'ordre de la seconde pour un mot — imperceptible à côté de l'envoi.
 */
function encoder(tampon: AudioBuffer, typeMime: string): Promise<Blob> {
  return new Promise((resoudre, rejeter) => {
    const contexte = new AudioContext({ sampleRate: tampon.sampleRate })
    const sortie = contexte.createMediaStreamDestination()
    const lecture = contexte.createBufferSource()
    lecture.buffer = tampon
    lecture.connect(sortie)

    const options: MediaRecorderOptions = { audioBitsPerSecond: DEBIT }
    if (typeMime && MediaRecorder.isTypeSupported(typeMime)) options.mimeType = typeMime

    const graveur = new MediaRecorder(sortie.stream, options)
    const morceaux: Blob[] = []

    graveur.ondataavailable = (evenement) => {
      if (evenement.data.size > 0) morceaux.push(evenement.data)
    }
    graveur.onstop = () => {
      void contexte.close()
      resoudre(new Blob(morceaux, { type: graveur.mimeType }))
    }
    graveur.onerror = (evenement) => {
      void contexte.close()
      rejeter(evenement)
    }

    // La queue du son arrive après la fin de la lecture : on laisse un instant
    // au graveur, sinon la dernière syllabe est tronquée.
    lecture.onended = () => setTimeout(() => graveur.stop(), 150)

    graveur.start()
    lecture.start()
  })
}

/**
 * Traite une prise. En cas d'échec, renvoie la prise brute.
 *
 * Ce repli n'est pas de la prudence décorative : une prise brute vaut
 * infiniment mieux qu'une prise perdue, et personne ne réenregistrera deux
 * cent quarante-trois mots parce qu'un filtre a mal tourné.
 */
export async function traiter(brute: Blob, typeMime: string): Promise<Blob> {
  try {
    const contexte = new AudioContext()
    const decode = await contexte.decodeAudioData(await brute.arrayBuffer())
    void contexte.close()

    return await encoder(tailler(await rendre(decode)), typeMime)
  } catch (cause) {
    console.warn('Traitement du son impossible, prise brute conservée.', cause)
    return brute
  }
}
