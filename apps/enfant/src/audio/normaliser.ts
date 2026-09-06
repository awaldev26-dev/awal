import { appliquer, bornesUtiles } from '@awal/audio'

/**
 * Met la prise de l'enfant au même niveau que la voix du père.
 *
 * Sans cela, l'Écho comparait des volumes : la voix du père est normalisée au
 * moment de l'enregistrement au studio, celle de l'enfant sortait brute du
 * micro. Une prise timide passait pour une mauvaise prononciation, une prise
 * criée pour une bonne.
 *
 * Le niveau visé vient de @awal/audio, le même module qu'emploie le studio —
 * c'est ce qui garantit que les deux voix convergent vraiment.
 *
 * On ne réencode pas : le résultat est joué directement par le Web Audio,
 * ce qui évite à la fois un aller-retour par MediaRecorder et une URL blob
 * à révoquer.
 */

/** Une prise mise à niveau, jouable et libérable. */
export interface PriseNormalisee {
  jouer: () => Promise<void>
  liberer: () => void
}

/**
 * Décode, met à niveau et rend une prise jouable.
 *
 * En cas d'échec — format non décodable, contexte audio refusé — renvoie null :
 * l'appelant retombe alors sur la lecture brute. Mieux vaut une comparaison
 * imparfaite que pas de comparaison.
 */
export async function normaliser(brute: Blob): Promise<PriseNormalisee | null> {
  let contexte: AudioContext | null = null
  try {
    contexte = new AudioContext()
    const decode = await contexte.decodeAudioData(await brute.arrayBuffer())

    // Mono : la voix n'a rien à gagner du second canal, et la mesure porterait
    // sur un mélange dont le niveau n'est pas celui qu'on entend.
    const entree = decode.getChannelData(0)
    const { debut, fin } = bornesUtiles(entree, decode.sampleRate)
    const utile = entree.subarray(debut, fin)

    const tampon = contexte.createBuffer(1, Math.max(1, utile.length), decode.sampleRate)
    appliquer(utile, tampon.getChannelData(0), decode.sampleRate)

    const actif = contexte
    let source: AudioBufferSourceNode | null = null

    return {
      jouer: () =>
        new Promise<void>((resoudre) => {
          // Une source ne se rejoue pas : il en faut une nouvelle à chaque fois.
          source?.stop()
          const lecture = actif.createBufferSource()
          lecture.buffer = tampon
          lecture.connect(actif.destination)
          lecture.onended = () => resoudre()
          source = lecture
          // Safari suspend le contexte hors geste utilisateur ; la reprise est
          // sans effet s'il tourne déjà.
          void actif.resume().catch(() => undefined)
          lecture.start()
        }),
      liberer: () => {
        source?.stop()
        source = null
        void actif.close().catch(() => undefined)
      },
    }
  } catch {
    void contexte?.close().catch(() => undefined)
    return null
  }
}
