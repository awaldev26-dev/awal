import type { LigneEntree } from '@/db/schema.js'

/**
 * Écarte les phrases dont tous les mots ne sont pas publiés.
 *
 * Une phrase enregistrée avant les mots qui la composent référencerait des
 * entrées absentes de l'artefact, ce que la validation refuse — et la
 * publication entière échouerait pour une seule phrase en avance.
 *
 * Vit dans son propre module, sans dépendance à la connexion : une fonction
 * pure ne doit pas être rendue intestable par le voisinage.
 */
export function ecarterPhrasesOrphelines(lignes: LigneEntree[]): LigneEntree[] {
  const presents = new Set(lignes.map((ligne) => ligne.id))
  return lignes.filter((ligne) => ligne.contient.every((id) => presents.has(id)))
}
