import type { Artefact } from '@awal/corpus'
import { analyserPicto, emojiDepuisPicto } from '@awal/corpus'

/**
 * Illustration d'une entrée, emoji ou image.
 *
 * Un seul composant pour les deux, afin qu'aucun écran n'ait à se demander de
 * quoi il s'agit : un mot dont le picto passe d'un emoji à une photo change
 * d'apparence sans qu'on touche à l'écran qui l'affiche.
 *
 * `taille` est une longueur CSS : elle sert de corps de police pour l'emoji et
 * de côté pour l'image, ce qui les rend visuellement comparables.
 */
export function Picto({
  picto,
  artefact,
  taille,
  className = '',
}: {
  picto: string
  artefact: Artefact
  taille: string
  className?: string
}) {
  const analyse = analyserPicto(picto)

  if (analyse?.type === 'image') {
    const base = artefact.urlBaseMedias.replace(/\/+$/, '')
    const cle = analyse.cle.replace(/^\/+/, '')
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`${base}/${cle}`}
        alt=""
        aria-hidden
        className={`shrink-0 rounded-[20%] object-cover ${className}`}
        style={{ width: taille, height: taille }}
      />
    )
  }

  return (
    <span aria-hidden className={`leading-none ${className}`} style={{ fontSize: taille }}>
      {emojiDepuisPicto(picto) || '❓'}
    </span>
  )
}
