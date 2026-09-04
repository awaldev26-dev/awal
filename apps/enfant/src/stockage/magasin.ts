import type { Progression } from '@/moteur/types'

export interface Profil {
  id: string
  prenom: string
  avatar: string
  age: number
}

/**
 * Frontière derrière laquelle vit la persistance. Une seconde implémentation
 * adossée à un serveur pourra s'y substituer le jour où un deuxième appareil
 * entre en jeu, sans toucher au reste de l'application.
 */
export interface MagasinProgression {
  profils(): Profil[]
  ajouterProfil(profil: Profil): void
  supprimerProfil(id: string): void
  progression(profilId: string): Progression
  enregistrer(profilId: string, progression: Progression): void
  /** Profil en cours de jeu, retenu pour qu'un rechargement n'y renvoie pas. */
  profilActif(): Profil | null
  definirProfilActif(id: string | null): void
}

export const AVATARS = ['🦊', '🐢', '🦁', '🐝', '🦋', '🐬', '🦉', '🐿️', '🦔', '🐧']
