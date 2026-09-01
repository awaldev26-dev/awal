import type { VerificateurMedias } from '@awal/corpus'
import { StockageDisque, racineParDefaut } from './disque.js'
import { StockageR2 } from './r2.js'
import { pictoValide } from './pictos.js'
import type { StockageMedias } from './types.js'

export * from './types.js'
export { StockageDisque } from './disque.js'
export { StockageR2 } from './r2.js'
export { pictoValide, emojiDepuisPicto } from './pictos.js'

function exige(nom: string): string {
  const valeur = process.env[nom]
  if (!valeur) throw new Error(`${nom} manquante alors que STOCKAGE=r2.`)
  return valeur
}

export function creerStockage(): StockageMedias {
  if (process.env.STOCKAGE === 'r2') {
    return new StockageR2(
      exige('R2_BUCKET'),
      exige('R2_URL_PUBLIQUE'),
      exige('R2_ACCOUNT_ID'),
      exige('R2_ACCESS_KEY_ID'),
      exige('R2_SECRET_ACCESS_KEY'),
    )
  }
  // Les audios publiés sont destinés à être copiés dans public/ de l'app enfant,
  // d'où une base relative par défaut. Le studio, lui, sert ses propres audios
  // par sa route /medias, indépendamment de cette valeur.
  return new StockageDisque(racineParDefaut(), process.env.STOCKAGE_DISQUE_URL_PUBLIQUE ?? '/')
}

/**
 * Branche le stockage sur l'interface attendue par @awal/corpus.
 * Les pictos étant des codepoints, leur vérification est purement syntaxique.
 */
export function creerVerificateur(stockage: StockageMedias): VerificateurMedias {
  return {
    audioExiste: (cle) => stockage.existe(cle),
    pictoExiste: async (reference) => pictoValide(reference),
  }
}
