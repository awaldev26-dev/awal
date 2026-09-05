'use client'

import type { EntreeSource } from '@/depot/types'
import { analyserPicto, emojiDepuisPicto } from '@awal/corpus'

/** Ce qu'on veut voir d'un coup d'œil : enregistré, à valider, ou rien. */
function Etat({ ligne }: { ligne: EntreeSource }) {
  if (!ligne.audio) {
    return <span className="text-xs text-encre-faible">—</span>
  }
  if (ligne.audio.includes('remplacement')) {
    return <span title="voix de synthèse" className="text-xs text-alerte">≈</span>
  }
  return <span title="enregistré" className="text-xs text-succes">●</span>
}

export function Liste({
  lignes,
  selection,
  urlBase,
  onSelectionner,
}: {
  lignes: EntreeSource[]
  selection: string | null
  urlBase: string
  onSelectionner: (id: string) => void
}) {
  if (lignes.length === 0) {
    return (
      <p className="p-bloc text-sm text-encre-faible">Aucune entrée ne correspond au filtre.</p>
    )
  }

  return (
    <ul className="divide-y divide-bordure">
      {lignes.map((ligne) => {
        const active = ligne.id === selection
        return (
          <li key={ligne.id}>
            <button
              type="button"
              onClick={() => onSelectionner(ligne.id)}
              aria-current={active}
              className={[
                'flex w-full items-center gap-encart px-bloc py-2.5 text-left transition',
                active ? 'bg-surface-active' : 'hover:bg-surface-creuse',
              ].join(' ')}
            >
              <span className="grid w-6 shrink-0 place-items-center text-lg leading-none">
                {(() => {
                  const analyse = analyserPicto(ligne.picto)
                  if (analyse?.type === 'image') {
                    // eslint-disable-next-line @next/next/no-img-element
                    return (
                      <img
                        src={`${urlBase}${analyse.cle}`}
                        alt=""
                        className="size-6 rounded-sm object-cover"
                      />
                    )
                  }
                  return emojiDepuisPicto(ligne.picto)
                })()}
              </span>
              <span
                className={[
                  'w-32 shrink-0 truncate font-kabyle text-sm',
                  active ? 'text-accent-sombre' : 'text-encre',
                ].join(' ')}
              >
                {ligne.kabyle}
              </span>
              <span className="flex-1 truncate text-sm text-encre-douce">{ligne.fr}</span>
              {ligne.aValider ? (
                <span title="à valider" className="text-xs text-alerte">
                  ⚠
                </span>
              ) : null}
              <Etat ligne={ligne} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
