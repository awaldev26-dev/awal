import { z } from 'zod'
import { pictoValide } from './picto'

/** Slug stable : minuscules, chiffres, tirets. Jamais renommé après publication. */
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Caractères propres à la graphie standard. Leur présence dans `kabyle`
 * signale une confusion avec `kabyleStd`, qui est l'erreur de saisie la plus probable
 * puisque les deux champs coexistent.
 */
export const CARACTERES_GRAPHIE_STANDARD = /[ɣɛḥẓṭṣḍčǧ]/u

export const TYPES_ENTREE = ['mot', 'phrase'] as const

export const schemaEntree = z.object({
  id: z.string().regex(SLUG, 'id : minuscules, chiffres et tirets uniquement'),
  type: z.enum(TYPES_ENTREE),
  kabyle: z
    .string()
    .min(1, 'kabyle : obligatoire')
    .refine(
      (valeur) => !CARACTERES_GRAPHIE_STANDARD.test(valeur),
      'kabyle : utiliser la transcription usuelle (gh, kh, ou, th, dh, 3, h), pas la graphie standard',
    ),
  kabyleStd: z.string().min(1).optional(),
  fr: z.string().min(1, 'fr : traduction obligatoire'),
  audio: z.string().min(1, 'audio : clé obligatoire'),
  variante: z.string().min(1, 'variante : obligatoire'),
  picto: z
    .string()
    .refine(pictoValide, 'picto : « openmoji:1F35E » ou « image:pictos/x.webp »'),
  themes: z.array(z.string().min(1)).min(1, 'themes : au moins un thème'),
  niveau: z.number().int().min(1).max(3).default(1),
  pluriel: z.string().min(1).optional(),
  contient: z.array(z.string().min(1)).default([]),
  notes: z.string().default(''),
})

/** Entrée validée : les champs à valeur par défaut sont toujours présents. */
export type Entree = z.output<typeof schemaEntree>

/** Entrée telle qu'on la saisit : les champs à valeur par défaut sont optionnels. */
export type EntreeSaisie = z.input<typeof schemaEntree>
