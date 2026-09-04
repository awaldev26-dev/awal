'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Artefact, Entree } from '@awal/corpus'
import { Lecteur } from '@/audio/lecteur.js'
import { chargerCorpus } from '@/corpus/charger.js'
import { appliquerResultats } from '@/moteur/session.js'
import type { Progression, ResultatEntree } from '@/moteur/types.js'
import { MagasinLocal } from '@/stockage/local.js'
import type { Profil } from '@/stockage/magasin.js'

interface ValeurAwal {
  artefact: Artefact | null
  erreur: string | null
  /**
   * Vrai une fois la restauration du profil retenu tentée. Les routes qui
   * exigent un profil doivent l'attendre : sans lui, leur garde-fou se
   * déclenche avant la restauration et renvoie au choix du profil à chaque
   * rechargement.
   */
  pret: boolean
  lecteur: Lecteur
  profil: Profil | null
  progression: Progression | null
  /** Lot de la session en cours. Volatil : perdu au rechargement, et c'est voulu. */
  lot: Entree[]
  /** Résultats de la dernière session, pour l'écran de bilan. Volatils aussi. */
  derniersResultats: ResultatEntree[]
  choisirProfil: (profil: Profil | null) => void
  demarrerLot: (entrees: Entree[]) => void
  terminerLot: (resultats: ResultatEntree[]) => void
  rafraichir: () => void
}

const Contexte = createContext<ValeurAwal | null>(null)

/**
 * État partagé par toutes les routes : le corpus, le lecteur audio, le profil
 * actif et sa progression.
 *
 * Vit dans le layout, donc survit à la navigation : le corpus n'est téléchargé
 * qu'une fois et le lecteur conserve ses audios préchargés d'un écran à l'autre.
 */
export function FournisseurAwal({ children }: { children: ReactNode }) {
  const magasin = useMemo(() => new MagasinLocal(), [])
  const lecteur = useMemo(() => new Lecteur(), [])

  const [artefact, setArtefact] = useState<Artefact | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [progression, setProgression] = useState<Progression | null>(null)
  const [lot, setLot] = useState<Entree[]>([])
  const [derniersResultats, setDerniersResultats] = useState<ResultatEntree[]>([])
  const [pret, setPret] = useState(false)

  useEffect(() => {
    chargerCorpus()
      .then(setArtefact)
      .catch((cause: unknown) => setErreur(String(cause)))
  }, [])

  useEffect(() => {
    // Pas de service worker en développement : Next y sert des fichiers dont
    // l'URL change à chaque démarrage, ce qui rend le cache inopérant et, pire,
    // masque les modifications de code derrière une version périmée.
    if (process.env.NODE_ENV !== 'production') return
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }
  }, [])

  // Reprend le profil retenu, pour qu'un rechargement ne ramène pas au choix.
  useEffect(() => {
    const retenu = magasin.profilActif()
    if (retenu) {
      setProfil(retenu)
      setProgression(magasin.progression(retenu.id))
    }
    setPret(true)
  }, [magasin])

  const choisirProfil = useCallback(
    (choisi: Profil | null) => {
      magasin.definirProfilActif(choisi?.id ?? null)
      setProfil(choisi)
      setProgression(choisi ? magasin.progression(choisi.id) : null)
      if (choisi) lecteur.deverrouiller()
    },
    [magasin, lecteur],
  )

  const terminerLot = useCallback(
    (resultats: ResultatEntree[]) => {
      setDerniersResultats(resultats)
      setLot([])
      if (!profil || !progression) return
      const suivante = appliquerResultats(progression, resultats, new Date())
      magasin.enregistrer(profil.id, suivante)
      setProgression(suivante)
    },
    [profil, progression, magasin],
  )

  const rafraichir = useCallback(() => {
    if (profil) setProgression(magasin.progression(profil.id))
  }, [profil, magasin])

  const valeur = useMemo<ValeurAwal>(
    () => ({
      artefact,
      erreur,
      pret,
      lecteur,
      profil,
      progression,
      lot,
      derniersResultats,
      choisirProfil,
      demarrerLot: setLot,
      terminerLot,
      rafraichir,
    }),
    [
      artefact,
      erreur,
      pret,
      lecteur,
      profil,
      progression,
      lot,
      derniersResultats,
      choisirProfil,
      terminerLot,
      rafraichir,
    ],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useAwal(): ValeurAwal {
  const valeur = useContext(Contexte)
  if (!valeur) throw new Error('useAwal doit être appelé sous FournisseurAwal.')
  return valeur
}

/** Magasin instancié à la demande, pour les écrans qui gèrent les profils. */
export function useMagasin(): MagasinLocal {
  return useMemo(() => new MagasinLocal(), [])
}
