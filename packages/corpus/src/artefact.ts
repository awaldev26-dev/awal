import { z } from 'zod'
import { schemaEntree } from './entree'
import { schemaTheme } from './theme'

/**
 * Artefact publié par le studio et consommé par l'app enfant.
 * `version` est incrémentée à chaque publication : elle sert à l'app à
 * savoir qu'un nouveau corpus est disponible sans comparer les contenus.
 */
export const schemaArtefact = z.object({
  version: z.number().int().positive(),
  publieLe: z.string().datetime(),
  /**
   * Base des URL de médias — audios et images de pictos.
   *
   * Soit absolue (« https://medias.exemple.com/ »), soit un chemin absolu
   * (« / ») quand les médias sont servis par la même origine que
   * l'application, ce qui est le cas en développement.
   */
  urlBaseMedias: z
    .string()
    .refine(
      (valeur) => valeur.startsWith('/') || /^https?:\/\//.test(valeur),
      'urlBaseMedias : URL absolue (https://…) ou chemin absolu (/…)',
    ),
  themes: z.array(schemaTheme).min(1),
  entrees: z.array(schemaEntree).min(1),
})

export type Artefact = z.output<typeof schemaArtefact>
