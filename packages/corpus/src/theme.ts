import { z } from 'zod'
import { SLUG } from './entree.js'

export const schemaTheme = z.object({
  id: z.string().regex(SLUG, 'id : minuscules, chiffres et tirets uniquement'),
  nom: z.string().min(1),
  picto: z.string().min(1),
  couleur: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'couleur : format hexadécimal, ex. #c94f3d'),
})

export type Theme = z.output<typeof schemaTheme>
