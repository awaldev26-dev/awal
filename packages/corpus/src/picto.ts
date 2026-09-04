/**
 * Référence d'illustration d'une entrée.
 *
 * Deux formes, distinguées par leur préfixe :
 *   — `openmoji:1F35E` — un ou plusieurs codepoints Unicode, rendus par le
 *     système. Aucun fichier à stocker, et le rendu est soigné sur iOS comme
 *     sur Android.
 *   — `image:pictos/lkanoun.webp` — une image dans le stockage, pour ce
 *     qu'aucun emoji ne sait dire : le kanoun, la fontaine du village, un
 *     visage de la famille.
 *
 * Le préfixe rend l'ajout d'une troisième forme possible sans migration.
 */

const EMOJI = /^openmoji:([0-9A-Fa-f]{4,6})(-[0-9A-Fa-f]{4,6})*$/
const PREFIXE_EMOJI = 'openmoji:'
const PREFIXE_IMAGE = 'image:'

export type PictoAnalyse =
  | { type: 'emoji'; codepoints: number[] }
  | { type: 'image'; cle: string }

export function analyserPicto(reference: string): PictoAnalyse | null {
  if (reference.startsWith(PREFIXE_EMOJI)) {
    if (!EMOJI.test(reference)) return null
    const codepoints = reference
      .slice(PREFIXE_EMOJI.length)
      .split('-')
      .map((part) => Number.parseInt(part, 16))
    if (codepoints.some((point) => !Number.isFinite(point) || point < 0 || point > 0x10ffff)) {
      return null
    }
    return { type: 'emoji', codepoints }
  }

  if (reference.startsWith(PREFIXE_IMAGE)) {
    const cle = reference.slice(PREFIXE_IMAGE.length)
    // Une clé vide ou remontant l'arborescence pourrait viser autre chose que
    // les illustrations : on refuse plutôt que de faire confiance.
    if (cle.length === 0 || cle.includes('..')) return null
    return { type: 'image', cle }
  }

  return null
}

export function pictoValide(reference: string): boolean {
  return analyserPicto(reference) !== null
}

/** Caractère à afficher, ou chaîne vide s'il s'agit d'une image. */
export function emojiDepuisPicto(reference: string): string {
  const analyse = analyserPicto(reference)
  if (analyse?.type !== 'emoji') return ''
  return String.fromCodePoint(...analyse.codepoints)
}

/** Clé de stockage d'une image, ou null s'il s'agit d'un emoji. */
export function clePictoImage(reference: string): string | null {
  const analyse = analyserPicto(reference)
  return analyse?.type === 'image' ? analyse.cle : null
}

/**
 * Référence correspondant à un emoji saisi au clavier.
 *
 * Permet au studio d'accepter une saisie directe — le clavier emoji du
 * système — plutôt qu'un sélecteur maison à maintenir.
 */
export function pictoDepuisEmoji(saisie: string): string | null {
  const propre = saisie.trim()
  if (propre.length === 0) return null
  const codepoints = [...propre].map((caractere) => caractere.codePointAt(0) ?? 0)
  if (codepoints.some((point) => point === 0)) return null
  return (
    PREFIXE_EMOJI +
    codepoints.map((point) => point.toString(16).toUpperCase().padStart(4, '0')).join('-')
  )
}
