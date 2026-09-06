'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Artefact, Entree, Theme } from '@awal/corpus'
import { jouerJusquAuBout } from '@/audio/lecteur'
import { DUREE_MAX_S, Micro, MicroRefuse } from '@/audio/micro'
import { urlAudio } from '@/corpus/charger'
import { BoutonRetour } from '@/interface/BoutonRetour'
import { ListeThemes, grouperParTheme } from '@/interface/ListeThemes'
import { Picto } from '@/jeux/Picto'
import { Touche } from '@/interface/Touche'

/**
 * Écho : l'enfant écoute le mot, le répète, puis s'entend.
 *
 * Rien n'est noté, et c'est délibéré. Sans reconnaissance vocale fiable, toute
 * évaluation serait un mensonge ; les orthophonistes procèdent d'ailleurs
 * ainsi, en faisant simplement entendre le modèle puis la production.
 *
 * L'écran n'écrit donc rien dans la progression : le brancher sur le moteur
 * l'obligerait à renvoyer un « réussi » sans avoir rien jugé, ce qui ferait
 * monter les boîtes et détruirait l'espacement.
 */
type Etat = 'pret' | 'enregistre' | 'compare'

export function Echo({
  artefact,
  theme: choisi,
  onChoisirTheme,
  onRetour,
}: {
  artefact: Artefact
  theme: Theme | null
  onChoisirTheme: (theme: Theme | null) => void
  onRetour: () => void
}) {
  const parTheme = useMemo(() => grouperParTheme(artefact), [artefact])
  const retour = () => (choisi ? onChoisirTheme(null) : onRetour())

  return (
    <main className="mx-auto w-full max-w-3xl px-bloc pt-carte pb-large">
      <header className="flex items-center gap-carte">
        <BoutonRetour onClick={retour} />
        {choisi ? (
          <h1
            className="flex min-w-0 items-center gap-2 font-mot text-2xl"
            style={{ color: choisi.couleur }}
          >
            <Picto picto={choisi.picto} artefact={artefact} taille="1.75rem" />
            <span className="truncate">{choisi.nom}</span>
          </h1>
        ) : (
          <h1 className="font-mot text-2xl text-encre">Répète après moi</h1>
        )}
      </header>

      {choisi === null ? (
        <ListeThemes artefact={artefact} parTheme={parTheme} onChoisir={onChoisirTheme} />
      ) : (
        <Exercice
          entrees={parTheme.get(choisi.id) ?? []}
          couleur={choisi.couleur}
          artefact={artefact}
        />
      )}
    </main>
  )
}

function Exercice({
  entrees,
  couleur,
  artefact,
}: {
  entrees: Entree[]
  couleur: string
  artefact: Artefact
}) {
  const [index, setIndex] = useState(0)
  const [etat, setEtat] = useState<Etat>('pret')
  const [secondes, setSecondes] = useState(0)
  const [maPrise, setMaPrise] = useState<string | null>(null)
  const [joue, setJoue] = useState<'modele' | 'moi' | null>(null)
  const [refuse, setRefuse] = useState(false)

  const micro = useRef(new Micro())
  // L'URL est doublée dans une référence pour pouvoir être révoquée sans
  // effet de bord dans un updater d'état, que React peut rejouer.
  const prise = useRef<string | null>(null)
  const entree = entrees[index]

  /** Révoque l'URL de la prise : rien ne doit survivre à sa réécoute. */
  function oublierPrise() {
    if (prise.current) URL.revokeObjectURL(prise.current)
    prise.current = null
    setMaPrise(null)
  }

  // Changer de mot referme tout : la prise du mot précédent n'a plus de sens.
  useEffect(() => {
    setEtat('pret')
    setSecondes(0)
    setJoue(null)
    oublierPrise()
  }, [entree?.id])

  // Quitter l'écran doit éteindre le micro, sans quoi l'indicateur du système
  // reste allumé — ce qui inquiète à juste titre.
  useEffect(() => {
    const courant = micro.current
    return () => {
      courant.annuler()
      if (prise.current) URL.revokeObjectURL(prise.current)
      prise.current = null
    }
  }, [])

  useEffect(() => {
    if (etat !== 'enregistre') return
    const minuteur = setInterval(() => setSecondes((valeur) => valeur + 1), 1000)
    return () => clearInterval(minuteur)
  }, [etat])

  // Arrêt d'office : un enfant peut lancer la prise puis poser l'appareil.
  useEffect(() => {
    if (etat === 'enregistre' && secondes >= DUREE_MAX_S) void arreter()
  }, [etat, secondes])

  if (!entree) {
    return <p className="mt-large text-center text-lg text-encre-douce">Aucun mot ici.</p>
  }

  const urlModele = urlAudio(artefact, entree)

  async function ecouterModele() {
    setJoue('modele')
    await jouerJusquAuBout(urlModele)
    setJoue(null)
  }

  async function basculer() {
    if (etat === 'enregistre') return arreter()
    if (etat !== 'pret' && etat !== 'compare') return

    setRefuse(false)
    oublierPrise()
    try {
      await micro.current.demarrer()
      setSecondes(0)
      setEtat('enregistre')
    } catch (cause) {
      if (cause instanceof MicroRefuse) setRefuse(true)
    }
  }

  async function arreter() {
    const url = await micro.current.arreter().catch(() => null)
    if (!url) return setEtat('pret')

    prise.current = url
    setMaPrise(url)
    setEtat('compare')
    // La comparaison est le cœur de l'exercice : on l'enchaîne d'office, le
    // modèle d'abord, pour que l'enfant entende l'écart sans rien avoir à faire.
    await comparer(url)
  }

  async function comparer(url: string) {
    setJoue('modele')
    await jouerJusquAuBout(urlModele)
    setJoue('moi')
    await jouerJusquAuBout(url)
    setJoue(null)
  }

  const disponible = Micro.disponible()

  return (
    <div className="mt-large flex flex-col items-center gap-large">
      <div className="flex flex-col items-center gap-carte">
        <Picto picto={entree.picto} artefact={artefact} taille="min(7rem, 30vw)" />
        <p className="text-center text-2xl text-encre">{entree.fr}</p>
      </div>

      <Touche
        ton="safran"
        taille="grande"
        onClick={ecouterModele}
        disabled={etat === 'enregistre' || joue !== null}
        className="w-touche"
      >
        {joue === 'modele' ? '🔊 …' : '👂 Écoute'}
      </Touche>

      {disponible ? (
        <button
          type="button"
          onClick={basculer}
          disabled={joue !== null && etat !== 'enregistre'}
          className={[
            'grid w-touche place-items-center gap-1 rounded-touche py-large text-center',
            'transition-transform duration-100 active:scale-[0.97] disabled:opacity-45',
            etat === 'enregistre' ? 'bg-enregistre text-white' : 'bg-accent text-white',
          ].join(' ')}
          style={etat === 'enregistre' ? undefined : { boxShadow: `0 0 26px 6px ${couleur}55` }}
        >
          {/* Le point qui pulse dit « ça tourne » à qui ne lit pas encore. */}
          {etat === 'enregistre' ? (
            <span className="flex items-center gap-3 text-5xl leading-none">
              <span className="size-4 animate-pulse rounded-pilule bg-white" />⏹
            </span>
          ) : (
            <span className="text-5xl leading-none">🎤</span>
          )}
          <span className="px-2 text-xl leading-tight">
            {etat === 'enregistre' ? `J'ai fini — ${secondes} s` : 'À toi !'}
          </span>
        </button>
      ) : (
        <p className="max-w-sm rounded-touche bg-surface px-bloc py-carte text-center text-encre-douce shadow-halo">
          Le micro n’est pas disponible ici. L’écoute des mots fonctionne quand même.
        </p>
      )}

      {refuse ? (
        <p
          role="alert"
          className="max-w-sm rounded-touche bg-surface px-bloc py-carte text-center text-encre-douce shadow-halo"
        >
          Il faut autoriser le micro pour s’enregistrer. Demande à un adulte.
        </p>
      ) : null}

      {maPrise ? (
        <div className="flex w-full flex-wrap justify-center gap-carte">
          <Touche ton="calme" onClick={ecouterModele} disabled={joue !== null}>
            👂 Le mot
          </Touche>
          <Touche
            ton="calme"
            onClick={async () => {
              setJoue('moi')
              await jouerJusquAuBout(maPrise)
              setJoue(null)
            }}
            disabled={joue !== null}
          >
            {joue === 'moi' ? '🔊 …' : '🙂 Toi'}
          </Touche>
          <Touche ton="safran" onClick={() => comparer(maPrise)} disabled={joue !== null}>
            🔁 Les deux
          </Touche>
        </div>
      ) : null}

      <div className="flex items-center gap-carte">
        <Touche
          ton="calme"
          onClick={() => setIndex((valeur) => (valeur - 1 + entrees.length) % entrees.length)}
          aria-label="mot précédent"
          disabled={etat === 'enregistre'}
        >
          ←
        </Touche>
        <span className="text-encre-douce">
          {index + 1} / {entrees.length}
        </span>
        <Touche
          ton="calme"
          onClick={() => setIndex((valeur) => (valeur + 1) % entrees.length)}
          aria-label="mot suivant"
          disabled={etat === 'enregistre'}
        >
          →
        </Touche>
      </div>
    </div>
  )
}
