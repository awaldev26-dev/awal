import { schemaArtefact, type Artefact } from '@awal/corpus'
import type { LigneEntree, LigneTheme } from '@/db/schema.js'

/** Une entrée en base n'est pas encore publiable — le plus souvent parce qu'elle n'a pas d'audio. */
export class EntreeIncomplete extends Error {
  constructor(
    readonly entreeId: string,
    readonly raison: string,
  ) {
    super(`Entrée « ${entreeId} » : ${raison}`)
    this.name = 'EntreeIncomplete'
  }
}

export interface OptionsArtefact {
  version: number
  publieLe: Date
  urlBaseMedias: string
}

/**
 * Traduit des lignes de base en artefact publiable, et le valide au passage.
 * Pure : ne lit rien, ce qui la rend testable sans Postgres.
 */
export function construireArtefact(
  entrees: LigneEntree[],
  themes: LigneTheme[],
  options: OptionsArtefact,
): Artefact {
  return schemaArtefact.parse({
    version: options.version,
    publieLe: options.publieLe.toISOString(),
    urlBaseMedias: options.urlBaseMedias,
    themes: [...themes]
      .sort((a, b) => a.ordre - b.ordre)
      .map(({ id, nom, picto, couleur }) => ({ id, nom, picto, couleur })),
    entrees: entrees.map((ligne) => {
      if (!ligne.audio) throw new EntreeIncomplete(ligne.id, 'aucun audio enregistré')
      return {
        id: ligne.id,
        type: ligne.type,
        kabyle: ligne.kabyle,
        ...(ligne.kabyleStd ? { kabyleStd: ligne.kabyleStd } : {}),
        fr: ligne.fr,
        audio: ligne.audio,
        variante: ligne.variante,
        picto: ligne.picto,
        themes: ligne.themes,
        niveau: ligne.niveau,
        ...(ligne.pluriel ? { pluriel: ligne.pluriel } : {}),
        contient: ligne.contient,
        notes: ligne.notes,
      }
    }),
  })
}
