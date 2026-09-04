import type { Artefact, Entree } from '@awal/corpus'
import type { Lecteur } from '@/audio/lecteur'
import type { ResultatEntree } from '@/moteur/types'

/**
 * Contrat commun à toutes les activités : elles reçoivent un lot et rendent,
 * pour chaque entrée, un simple réussi/raté. Le moteur ignore quelle activité
 * a produit le résultat — c'est ce qui permet d'en ajouter sans rien toucher.
 */
export interface ProprietesJeu {
  lot: Entree[]
  artefact: Artefact
  lecteur: Lecteur
  onTermine: (resultats: ResultatEntree[]) => void
}
