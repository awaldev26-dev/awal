'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LigneEntree, LigneTheme } from '@/db/schema.js'
import { BarreHaut } from './BarreHaut.js'
import { Editeur } from './Editeur.js'
import { Liste } from './Liste.js'
import { classesChamp } from './Champ.js'

type Filtre = 'tout' | 'sans-audio' | 'synthese' | 'a-valider'

const FILTRES: { cle: Filtre; nom: string }[] = [
  { cle: 'tout', nom: 'Tout' },
  { cle: 'sans-audio', nom: 'Sans audio' },
  { cle: 'synthese', nom: 'Voix de synthèse' },
  { cle: 'a-valider', nom: 'À valider' },
]

function correspond(ligne: LigneEntree, filtre: Filtre): boolean {
  if (filtre === 'sans-audio') return ligne.audio === null
  if (filtre === 'synthese') return ligne.audio?.includes('remplacement') ?? false
  if (filtre === 'a-valider') return ligne.aValider
  return true
}

export function Studio({
  entrees,
  themes,
  derniereVersion,
  urlBase,
}: {
  entrees: LigneEntree[]
  themes: LigneTheme[]
  derniereVersion: number | null
  urlBase: string
}) {
  const router = useRouter()
  const [filtre, setFiltre] = useState<Filtre>('tout')
  const [theme, setTheme] = useState<string>('tout')
  const [recherche, setRecherche] = useState('')
  const [selection, setSelection] = useState<string | null>(entrees[0]?.id ?? null)

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    return entrees.filter(
      (ligne) =>
        correspond(ligne, filtre) &&
        (theme === 'tout' || ligne.themes.includes(theme)) &&
        (terme === '' ||
          ligne.kabyle.toLowerCase().includes(terme) ||
          ligne.fr.toLowerCase().includes(terme)),
    )
  }, [entrees, filtre, theme, recherche])

  const index = visibles.findIndex((ligne) => ligne.id === selection)
  const courante = index >= 0 ? visibles[index] : visibles[0]

  // Se déplacer dans la liste filtrée, en bouclant : on enchaîne sans réfléchir.
  function decaler(pas: number) {
    if (visibles.length === 0) return
    const depart = index >= 0 ? index : 0
    const suivant = (depart + pas + visibles.length) % visibles.length
    setSelection(visibles[suivant]?.id ?? null)
  }

  // Ne comptent que les vraies prises : une barre pleine de voix de synthèse
  // ne dirait rien de la progression réelle.
  const enregistrees = entrees.filter(
    (ligne) => ligne.audio !== null && !ligne.audio.includes('remplacement'),
  ).length

  return (
    <div className="flex h-dvh flex-col">
      <BarreHaut
        enregistrees={enregistrees}
        total={entrees.length}
        derniereVersion={derniereVersion}
        onPublie={() => router.refresh()}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-liste shrink-0 flex-col border-r border-bordure bg-surface">
          <div className="space-y-encart border-b border-bordure p-bloc">
            <input
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Chercher un mot…"
              className={classesChamp}
            />

            <select
              value={theme}
              onChange={(evenement) => setTheme(evenement.target.value)}
              className={classesChamp}
            >
              <option value="tout">Tous les thèmes</option>
              {themes.map((candidat) => (
                <option key={candidat.id} value={candidat.id}>
                  {candidat.nom}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1">
              {FILTRES.map(({ cle, nom }) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => setFiltre(cle)}
                  className={[
                    'rounded-pilule px-2.5 py-1 text-xs font-medium transition',
                    filtre === cle
                      ? 'bg-accent text-white'
                      : 'bg-surface-creuse text-encre-douce hover:bg-bordure',
                  ].join(' ')}
                >
                  {nom}
                </button>
              ))}
            </div>

            <p className="text-xs text-encre-faible">
              {visibles.length} entrée{visibles.length > 1 ? 's' : ''} affichée
              {visibles.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Liste lignes={visibles} selection={courante?.id ?? null} onSelectionner={setSelection} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-fond">
          {courante ? (
            <Editeur
              key={courante.id}
              ligne={courante}
              urlBase={urlBase}
              position={index >= 0 ? index + 1 : 1}
              total={visibles.length}
              onPrecedent={() => decaler(-1)}
              onSuivant={() => decaler(1)}
              onModifie={() => router.refresh()}
            />
          ) : (
            <p className="p-section text-sm text-encre-faible">
              Aucune entrée sélectionnée.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
