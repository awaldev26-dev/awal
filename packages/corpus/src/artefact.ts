import { z } from 'zod'
import { schemaEntree } from './entree.js'
import { schemaTheme } from './theme.js'

/**
 * Artefact publié par le studio et consommé par l'app enfant.
 * `version` est incrémentée à chaque publication : elle sert à l'app à
 * savoir qu'un nouveau corpus est disponible sans comparer les contenus.
 */
export const schemaArtefact = z.object({
  version: z.number().int().positive(),
  publieLe: z.string().datetime(),
  urlBaseAudio: z.string().url(),
  themes: z.array(schemaTheme).min(1),
  entrees: z.array(schemaEntree).min(1),
})

export type Artefact = z.output<typeof schemaArtefact>
