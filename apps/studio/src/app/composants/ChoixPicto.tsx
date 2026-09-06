'use client'

import { useEffect, useRef, useState } from 'react'
import { analyserPicto, emojiDepuisPicto, pictoDepuisEmoji } from '@awal/corpus'
import { definirPictoEmoji, televerserPicto } from '../actions'

/** Côté du carré dans lequel l'image est recadrée avant envoi. */
const COTE = 256

/**
 * Réduit une image au format d'une vignette, dans le navigateur.
 *
 * Une photo de téléphone pèse plusieurs mégaoctets ; envoyée telle quelle,
 * deux cents illustrations rempliraient le bucket et ralentiraient l'app.
 * On recadre au centre en carré, puis on encode en WebP — de l'ordre de
 * vingt kilo-octets.
 */
async function reduire(fichier: File): Promise<File> {
  const image = await createImageBitmap(fichier)
  const cote = Math.min(image.width, image.height)
  const toile = document.createElement('canvas')
  toile.width = COTE
  toile.height = COTE

  const contexte = toile.getContext('2d')
  if (!contexte) throw new Error('Canvas indisponible.')
  contexte.drawImage(
    image,
    (image.width - cote) / 2,
    (image.height - cote) / 2,
    cote,
    cote,
    0,
    0,
    COTE,
    COTE,
  )

  const blob = await new Promise<Blob | null>((resoudre) =>
    toile.toBlob(resoudre, 'image/webp', 0.85),
  )
  if (!blob) throw new Error('Conversion de l’image impossible.')
  return new File([blob], 'picto.webp', { type: 'image/webp' })
}

export function ChoixPicto({
  entreeId,
  picto,
  urlBase,
  onChange,
}: {
  entreeId: string
  picto: string
  urlBase: string
  onChange: () => void
}) {
  const analyse = analyserPicto(picto)
  const [saisie, setSaisie] = useState(emojiDepuisPicto(picto))
  const [etat, setEtat] = useState<'pret' | 'envoi'>('pret')
  const [erreur, setErreur] = useState<string | null>(null)
  const fichierRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setSaisie(emojiDepuisPicto(picto))
    setErreur(null)
  }, [picto, entreeId])

  async function validerEmoji() {
    const reference = pictoDepuisEmoji(saisie)
    if (!reference) {
      setErreur('Colle un emoji dans le champ.')
      return
    }
    setEtat('envoi')
    setErreur(null)
    await definirPictoEmoji(entreeId, reference)
    setEtat('pret')
    onChange()
  }

  async function choisirImage(fichier: File) {
    setEtat('envoi')
    setErreur(null)
    try {
      await televerserPicto(entreeId, await reduire(fichier))
      onChange()
    } catch (cause) {
      setErreur(String(cause).slice(0, 120))
    }
    setEtat('pret')
    if (fichierRef.current) fichierRef.current.value = ''
  }

  return (
    <div className="rounded-panneau border border-bordure bg-surface p-bloc">
      <div className="flex items-start gap-encart md:gap-bloc">
        <div className="grid size-16 shrink-0 place-items-center md:size-20 overflow-hidden rounded-panneau border border-bordure bg-surface-creuse">
          {analyse?.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${urlBase}${analyse.cle}`} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-4xl leading-none">{emojiDepuisPicto(picto) || '❓'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-encart">
          <div>
            <span className="mb-1 block text-xs font-medium tracking-wide text-encre-douce uppercase">
              Illustration
            </span>
            <div className="flex flex-wrap gap-encart">
              <input
                value={saisie}
                onChange={(evenement) => setSaisie(evenement.target.value)}
                onKeyDown={(evenement) => {
                  if (evenement.key === 'Enter') {
                    evenement.preventDefault()
                    void validerEmoji()
                  }
                }}
                placeholder="Colle un emoji"
                aria-label="emoji de l’entrée"
                className="w-24 rounded-champ border border-bordure bg-surface px-3 py-2 text-center text-xl focus:border-accent focus:outline-none md:w-28"
              />
              <button
                type="button"
                onClick={validerEmoji}
                disabled={etat === 'envoi'}
                className="rounded-champ border border-bordure bg-surface px-3 py-2 text-sm whitespace-nowrap text-encre-douce transition hover:bg-surface-creuse disabled:opacity-50"
              >
                Utiliser cet emoji
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-encart">
            <input
              ref={fichierRef}
              type="file"
              accept="image/*"
              onChange={(evenement) => {
                const fichier = evenement.target.files?.[0]
                if (fichier) void choisirImage(fichier)
              }}
              className="hidden"
              id={`picto-fichier-${entreeId}`}
            />
            <label
              htmlFor={`picto-fichier-${entreeId}`}
              className="cursor-pointer rounded-champ border border-bordure bg-surface px-3 py-2 text-sm whitespace-nowrap text-encre-douce transition hover:bg-surface-creuse"
            >
              {etat === 'envoi' ? 'Envoi…' : 'Choisir une photo…'}
            </label>
            <span className="text-xs text-encre-faible">
              recadrée en carré de {COTE} px, convertie en WebP
            </span>
          </div>

          {erreur ? <p className="text-xs text-danger">{erreur}</p> : null}

          <p className="font-kabyle text-xs text-encre-faible">{picto}</p>
        </div>
      </div>
    </div>
  )
}
