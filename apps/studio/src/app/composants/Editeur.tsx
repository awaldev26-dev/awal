'use client'

import { useEffect, useState } from 'react'
import type { LigneEntree } from '@/db/schema.js'
import { analyserPicto, emojiDepuisPicto } from '@awal/corpus'
import { enregistrerEntree } from '../actions.js'
import { Champ, classesChamp } from './Champ.js'
import { ChoixPicto } from './ChoixPicto.js'
import { Enregistreur } from './Enregistreur.js'

/** Affiche l'illustration, qu'elle soit un emoji ou une image. */
function Vignette({ picto, urlBase }: { picto: string; urlBase: string }) {
  const analyse = analyserPicto(picto)
  if (analyse?.type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={`${urlBase}${analyse.cle}`}
        alt=""
        className="size-11 shrink-0 rounded-champ object-cover"
      />
    )
  }
  return <span className="text-4xl leading-none">{emojiDepuisPicto(picto)}</span>
}

export function Editeur({
  ligne,
  urlBase,
  position,
  total,
  onPrecedent,
  onSuivant,
  onModifie,
}: {
  ligne: LigneEntree
  urlBase: string
  position: number
  total: number
  onPrecedent: () => void
  onSuivant: () => void
  onModifie: () => void
}) {
  const [enCours, setEnCours] = useState(false)
  const [enregistre, setEnregistre] = useState(false)

  // Change d'entrée : on efface la confirmation précédente.
  useEffect(() => setEnregistre(false), [ligne.id])

  async function soumettre(donnees: FormData) {
    setEnCours(true)
    await enregistrerEntree(donnees)
    setEnCours(false)
    setEnregistre(true)
    onModifie()
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-bloc border-b border-bordure px-section py-bloc">
        <Vignette picto={ligne.picto} urlBase={urlBase} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-kabyle text-xl text-encre">{ligne.kabyle}</h1>
          <p className="truncate text-sm text-encre-douce">{ligne.fr}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs text-encre-faible">
            {position} / {total}
          </span>
          <button
            type="button"
            onClick={onPrecedent}
            aria-label="entrée précédente"
            className="size-9 rounded-champ border border-bordure bg-surface text-encre-douce transition hover:bg-surface-creuse"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onSuivant}
            aria-label="entrée suivante"
            className="size-9 rounded-champ border border-bordure bg-surface text-encre-douce transition hover:bg-surface-creuse"
          >
            →
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-bloc overflow-y-auto p-section">
        <Enregistreur
          entreeId={ligne.id}
          audioActuel={ligne.audio}
          urlBase={urlBase}
          onEnvoye={onModifie}
        />

        <ChoixPicto
          entreeId={ligne.id}
          picto={ligne.picto}
          urlBase={urlBase}
          onChange={onModifie}
        />

        <form action={soumettre} className="space-y-bloc">
          <input type="hidden" name="id" value={ligne.id} />

          <div className="grid gap-bloc sm:grid-cols-2">
            <Champ etiquette="Kabyle" aide="Transcription usuelle : gh, kh, ou, th, dh, 3">
              <input
                name="kabyle"
                defaultValue={ligne.kabyle}
                className={`${classesChamp} font-kabyle`}
              />
            </Champ>

            <Champ etiquette="Français">
              <input name="fr" defaultValue={ligne.fr} className={classesChamp} />
            </Champ>

            <Champ etiquette="Pluriel" aide="Facultatif">
              <input
                name="pluriel"
                defaultValue={ligne.pluriel ?? ''}
                className={`${classesChamp} font-kabyle`}
              />
            </Champ>

            <Champ etiquette="Niveau" aide="1 pour les plus jeunes, 3 pour les lecteurs">
              <input
                type="number"
                name="niveau"
                min={1}
                max={3}
                defaultValue={ligne.niveau}
                className={classesChamp}
              />
            </Champ>
          </div>

          <Champ etiquette="Notes">
            <input name="notes" defaultValue={ligne.notes} className={classesChamp} />
          </Champ>

          <label className="flex items-center gap-2 text-sm text-encre-douce">
            <input
              type="checkbox"
              name="aValider"
              defaultChecked={ligne.aValider}
              className="size-4 accent-[var(--color-accent)]"
            />
            À valider — décoche quand tu as confirmé la forme
          </label>

          <div className="flex items-center gap-encart border-t border-bordure pt-bloc">
            <button
              type="submit"
              disabled={enCours}
              className="rounded-champ bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-sombre disabled:opacity-50"
            >
              {enCours ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
            {enregistre ? <span className="text-sm text-succes">Enregistré.</span> : null}
          </div>
        </form>

        {ligne.contient.length > 0 ? (
          <p className="text-xs text-encre-faible">
            Cette phrase emploie&nbsp;
            <span className="font-kabyle">{ligne.contient.join(', ')}</span> — elle ne sera
            proposée qu’une fois ces mots connus.
          </p>
        ) : null}
      </div>
    </div>
  )
}
