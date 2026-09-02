'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Artefact, Entree } from '@awal/corpus'
import { Lecteur } from '@/audio/lecteur.js'
import { chargerCorpus, urlAudio } from '@/corpus/charger.js'
import { estAcquise } from '@/moteur/leitner.js'
import { composerEntrainement, themesDisponibles } from '@/moteur/entrainement.js'
import { OPTIONS_PAR_AGE, appliquerResultats, composerSession, serie } from '@/moteur/session.js'
import type { Progression, ResultatEntree } from '@/moteur/types.js'
import { MagasinLocal } from '@/stockage/local.js'
import type { Profil } from '@/stockage/magasin.js'
import { EcouteEtChoisis } from '@/jeux/EcouteEtChoisis.js'
import { Memory } from '@/jeux/Memory.js'
import { Accueil } from './ecrans/Accueil.js'
import { Bilan } from './ecrans/Bilan.js'
import { ChoixProfil } from './ecrans/ChoixProfil.js'
import { Collection } from './ecrans/Collection.js'
import { Entrainement } from './ecrans/Entrainement.js'

type Ecran = 'profil' | 'accueil' | 'session' | 'collection' | 'bilan' | 'entrainement'

/**
 * L'application entière tient dans un composant client. Il n'y a pas de serveur,
 * la navigation par URL n'apporterait rien à un enfant, et un état local rend
 * les transitions instantanées.
 */
export function Application() {
  const magasin = useMemo(() => new MagasinLocal(), [])
  const lecteur = useMemo(() => new Lecteur(), [])
  const [artefact, setArtefact] = useState<Artefact | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [progression, setProgression] = useState<Progression | null>(null)
  const [ecran, setEcran] = useState<Ecran>('profil')
  const [derniersResultats, setDerniersResultats] = useState<ResultatEntree[]>([])
  const [jeu, setJeu] = useState<'ecoute' | 'memory'>('ecoute')
  /** Vrai quand le lot en cours vient de l'entraînement : ses résultats ne comptent pas. */
  const [libre, setLibre] = useState(false)
  const lot = useRef<Entree[]>([])

  useEffect(() => {
    chargerCorpus()
      .then(setArtefact)
      .catch((cause: unknown) => setErreur(String(cause)))
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }
  }, [])

  const choisirProfil = useCallback(
    (choisi: Profil) => {
      lecteur.deverrouiller()
      setProfil(choisi)
      setProgression(magasin.progression(choisi.id))
      setEcran('accueil')
    },
    [lecteur, magasin],
  )

  const demarrer = useCallback(async () => {
    if (!artefact || !profil || !progression) return
    const options = OPTIONS_PAR_AGE(profil.age)
    const compose = composerSession(artefact.entrees, progression, options, new Date())
    if (compose.length === 0) return
    lot.current = compose
    await lecteur.precharger(compose.map((entree) => urlAudio(artefact, entree)))
    setJeu(compose.length >= 6 && Math.random() < 0.4 ? 'memory' : 'ecoute')
    setLibre(false)
    setEcran('session')
  }, [artefact, profil, progression, lecteur])

  const demarrerEntrainement = useCallback(
    async (themeId?: string) => {
      if (!artefact || !profil || !progression) return
      const options = OPTIONS_PAR_AGE(profil.age)
      const compose = composerEntrainement(artefact.entrees, progression, {
        taille: options.taille,
        niveauMax: options.niveauMax,
        theme: themeId,
      })
      if (compose.length === 0) return
      lot.current = compose
      await lecteur.precharger(compose.map((entree) => urlAudio(artefact, entree)))
      setJeu(compose.length >= 6 && Math.random() < 0.5 ? 'memory' : 'ecoute')
      setLibre(true)
      setEcran('session')
    },
    [artefact, profil, progression, lecteur],
  )

  const terminer = useCallback(
    (resultats: ResultatEntree[]) => {
      if (!profil || !progression) return

      // L'entraînement n'écrit rien : faire monter les boîtes en rejouant
      // détruirait la répétition espacée. On revient simplement à l'accueil.
      if (libre) {
        setEcran('entrainement')
        return
      }

      const suivante = appliquerResultats(progression, resultats, new Date())
      magasin.enregistrer(profil.id, suivante)
      setProgression(suivante)
      setDerniersResultats(resultats)
      setEcran('bilan')
    },
    [profil, progression, magasin, libre],
  )

  if (erreur) {
    return (
      <main style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 64 }}>📡</p>
        <p>Le corpus n’a pas pu être chargé.</p>
        <p style={{ opacity: 0.6, fontSize: 13 }}>{erreur}</p>
      </main>
    )
  }

  if (!artefact) {
    return <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', fontSize: 64 }}>⏳</main>
  }

  if (ecran === 'profil' || !profil || !progression) {
    return <ChoixProfil magasin={magasin} onChoisi={choisirProfil} />
  }

  if (ecran === 'session') {
    const proprietes = { lot: lot.current, artefact, lecteur, onTermine: terminer }
    return jeu === 'memory' ? <Memory {...proprietes} /> : <EcouteEtChoisis {...proprietes} />
  }

  if (ecran === 'collection') {
    return <Collection artefact={artefact} progression={progression} onRetour={() => setEcran('accueil')} />
  }

  if (ecran === 'entrainement') {
    return (
      <Entrainement
        disponibles={themesDisponibles(
          artefact.entrees,
          artefact.themes,
          progression,
          OPTIONS_PAR_AGE(profil.age).niveauMax,
        )}
        onChoisir={demarrerEntrainement}
        onRetour={() => setEcran('accueil')}
      />
    )
  }

  if (ecran === 'bilan') {
    const acquises = derniersResultats
      .map((resultat) => resultat.entreeId)
      .filter((id) => {
        const etat = progression.etats[id]
        return etat !== undefined && estAcquise(etat)
      })
      .map((id) => artefact.entrees.find((entree) => entree.id === id))
      .filter((entree): entree is Entree => entree !== undefined)

    return <Bilan acquises={acquises} onContinuer={() => setEcran('accueil')} />
  }

  const options = OPTIONS_PAR_AGE(profil.age)
  const aFaire = composerSession(artefact.entrees, progression, options, new Date()).length
  const peutSentrainer = Object.keys(progression.etats).length > 0

  return (
    <Accueil
      profil={profil}
      serie={serie(progression, new Date())}
      aFaire={aFaire}
      peutSentrainer={peutSentrainer}
      onDemarrer={demarrer}
      onEntrainement={() => setEcran('entrainement')}
      onCollection={() => setEcran('collection')}
      onChangerProfil={() => setEcran('profil')}
    />
  )
}
