import { progressionVide, type Progression } from '@/moteur/types.js'
import type { MagasinProgression, Profil } from './magasin.js'

const CLE_PROFILS = 'awal.profils'
const PREFIXE_PROGRESSION = 'awal.progression.'

/**
 * localStorage plutôt qu'IndexedDB : la progression pèse une vingtaine de
 * kilo-octets, l'API synchrone supprime une course au démarrage, et le volume
 * ne justifie pas la complexité. À revoir quand l'Écho stockera des blobs audio.
 */
export class MagasinLocal implements MagasinProgression {
  private lire<T>(cle: string, defaut: T): T {
    try {
      const brut = localStorage.getItem(cle)
      return brut === null ? defaut : (JSON.parse(brut) as T)
    } catch {
      // Données corrompues : mieux vaut repartir de zéro que refuser de démarrer.
      return defaut
    }
  }

  profils(): Profil[] {
    return this.lire<Profil[]>(CLE_PROFILS, [])
  }

  ajouterProfil(profil: Profil): void {
    const autres = this.profils().filter((p) => p.id !== profil.id)
    localStorage.setItem(CLE_PROFILS, JSON.stringify([...autres, profil]))
  }

  supprimerProfil(id: string): void {
    localStorage.setItem(CLE_PROFILS, JSON.stringify(this.profils().filter((p) => p.id !== id)))
    localStorage.removeItem(PREFIXE_PROGRESSION + id)
  }

  progression(profilId: string): Progression {
    const lue = this.lire<Partial<Progression>>(PREFIXE_PROGRESSION + profilId, {})
    return {
      etats: lue.etats ?? {},
      nouveauxParJour: lue.nouveauxParJour ?? {},
      joursJoues: lue.joursJoues ?? [],
    }
  }

  enregistrer(profilId: string, progression: Progression): void {
    localStorage.setItem(PREFIXE_PROGRESSION + profilId, JSON.stringify(progression))
  }
}
