import type { Artefact } from './artefact.js'

export type CodeProbleme =
  | 'id-duplique'
  | 'theme-inconnu'
  | 'reference-inconnue'
  | 'mot-avec-contient'
  | 'auto-reference'
  | 'audio-absent'
  | 'picto-absent'

export interface ProblemeValidation {
  code: CodeProbleme
  entreeId?: string
  message: string
}

/**
 * Règles qui portent sur les relations entre entrées, donc invérifiables
 * par un schéma pris isolément. Pure et synchrone : aucun accès disque ou réseau.
 *
 * Accumule tous les problèmes au lieu de s'arrêter au premier — le studio les
 * affiche ensemble, on ne veut pas les faire corriger un par un.
 */
export function validerStructure(artefact: Artefact): ProblemeValidation[] {
  const problemes: ProblemeValidation[] = []
  const idsThemes = new Set(artefact.themes.map((theme) => theme.id))
  const idsEntrees = new Set(artefact.entrees.map((entree) => entree.id))
  const dejaVus = new Set<string>()

  for (const entree of artefact.entrees) {
    if (dejaVus.has(entree.id)) {
      problemes.push({
        code: 'id-duplique',
        entreeId: entree.id,
        message: `L'identifiant « ${entree.id} » apparaît plusieurs fois.`,
      })
    }
    dejaVus.add(entree.id)

    for (const theme of entree.themes) {
      if (!idsThemes.has(theme)) {
        problemes.push({
          code: 'theme-inconnu',
          entreeId: entree.id,
          message: `Le thème « ${theme} » n'est pas déclaré.`,
        })
      }
    }

    if (entree.type === 'mot' && entree.contient.length > 0) {
      problemes.push({
        code: 'mot-avec-contient',
        entreeId: entree.id,
        message: `« ${entree.id} » est un mot : le champ contient doit rester vide.`,
      })
      continue
    }

    for (const reference of entree.contient) {
      if (reference === entree.id) {
        problemes.push({
          code: 'auto-reference',
          entreeId: entree.id,
          message: `« ${entree.id} » se référence elle-même.`,
        })
      } else if (!idsEntrees.has(reference)) {
        problemes.push({
          code: 'reference-inconnue',
          entreeId: entree.id,
          message: `« ${entree.id} » référence « ${reference} », qui n'existe pas.`,
        })
      }
    }
  }

  return problemes
}
