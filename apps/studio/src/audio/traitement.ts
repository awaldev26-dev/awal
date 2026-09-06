import { appliquer, bornesUtiles } from '@awal/audio'

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
 * le Web Audio suffit. La mesure du niveau et la coupe du silence viennent de
 * @awal/audio, que l'app enfant emploie aussi : l'Écho compare la voix du père
 * à celle de l'enfant, et cette comparaison n'a de sens que si les deux visent
 * le même niveau.
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

/** Débit de l'encodage. Large pour une voix seule en mono. */
const DEBIT = 48_000

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

  const taille = new AudioBuffer({
    length: Math.max(1, utile.length),
    numberOfChannels: 1,
    sampleRate: rendu.sampleRate,
  })
  appliquer(utile, taille.getChannelData(0), rendu.sampleRate)
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
