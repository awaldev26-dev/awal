import type { Artefact } from './artefact.js'
import type { ProblemeValidation } from './validation.js'

/**
 * Accès aux médias, injecté par l'appelant. Le paquet corpus ne fait aucun I/O :
 * le studio branchera une implémentation adossée à R2, les tests une implémentation en mémoire.
 */
export interface VerificateurMedias {
  audioExiste(cle: string): Promise<boolean>
  pictoExiste(reference: string): Promise<boolean>
}

/**
 * Vérifie que chaque entrée a bien son audio et son picto.
 * C'est cette règle qui rend impossible la publication d'un mot muet.
 */
export async function validerMedias(
  artefact: Artefact,
  verificateur: VerificateurMedias,
): Promise<ProblemeValidation[]> {
  const controles = artefact.entrees.map(async (entree) => {
    const [audioPresent, pictoPresent] = await Promise.all([
      verificateur.audioExiste(entree.audio),
      verificateur.pictoExiste(entree.picto),
    ])

    const problemes: ProblemeValidation[] = []
    if (!audioPresent) {
      problemes.push({
        code: 'audio-absent',
        entreeId: entree.id,
        message: `L'audio « ${entree.audio} » est introuvable.`,
      })
    }
    if (!pictoPresent) {
      problemes.push({
        code: 'picto-absent',
        entreeId: entree.id,
        message: `Le picto « ${entree.picto} » est introuvable.`,
      })
    }
    return problemes
  })

  return (await Promise.all(controles)).flat()
}
