import { z } from 'zod'
import { SLUG, TYPES_ENTREE, pictoValide } from '@awal/corpus'

/**
 * Entrée telle qu'elle est stockée dans la source de vérité.
 *
 * Plus permissive que le schéma de publication : `audio` peut manquer, puisque
 * l'entrée existe avant d'être enregistrée, et `picto` doit néanmoins être
 * valide pour qu'on ne stocke pas de référence inutilisable.
 */
export const schemaEntreeSource = z.object({
  id: z.string().regex(SLUG),
  type: z.enum(TYPES_ENTREE),
  kabyle: z.string().min(1),
  kabyleStd: z.string().nullable().default(null),
  fr: z.string().min(1),
  audio: z.string().nullable().default(null),
  variante: z.string().min(1).default('kabyle-nord'),
  picto: z.string().refine(pictoValide),
  themes: z.array(z.string()).default([]),
  niveau: z.number().int().min(1).max(3).default(1),
  pluriel: z.string().nullable().default(null),
  contient: z.array(z.string()).default([]),
  notes: z.string().default(''),
  /** Vrai tant que le locuteur natif n'a pas confirmé la forme. */
  aValider: z.boolean().default(true),
  /** Position dans le document de corpus : c'est un choix éditorial. */
  ordre: z.number().int().default(0),
})

export const schemaThemeSource = z.object({
  id: z.string().regex(SLUG),
  nom: z.string().min(1),
  picto: z.string().refine(pictoValide),
  couleur: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  ordre: z.number().int().default(0),
})

export const schemaPublication = z.object({
  version: z.number().int().positive(),
  publieLe: z.string(),
  nbEntrees: z.number().int().nonnegative(),
})

/**
 * Source de vérité du corpus, un seul fichier JSON dans le stockage.
 *
 * Remplace la base Postgres, dont aucune capacité n'était utilisée : dix
 * requêtes, aucune jointure, aucune transaction, pour deux cent soixante
 * lignes modifiées par une seule personne. Un fichier évite un service à
 * provisionner, ses réveils à froid, et se sauvegarde par les versions du
 * stockage.
 */
export const schemaDepot = z.object({
  /** Version du format, pour pouvoir migrer sans deviner. */
  format: z.literal(1).default(1),
  themes: z.array(schemaThemeSource).default([]),
  entrees: z.array(schemaEntreeSource).default([]),
  publications: z.array(schemaPublication).default([]),
})

export type EntreeSource = z.output<typeof schemaEntreeSource>
export type ThemeSource = z.output<typeof schemaThemeSource>
export type Depot = z.output<typeof schemaDepot>

export function depotVide(): Depot {
  return { format: 1, themes: [], entrees: [], publications: [] }
}
