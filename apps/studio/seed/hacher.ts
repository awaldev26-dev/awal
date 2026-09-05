/**
 * Produit l'empreinte à mettre dans STUDIO_MOT_DE_PASSE_HACHE.
 *
 * Le mot de passe n'est jamais stocké : seule son empreinte scrypt l'est, si
 * bien qu'une fuite des variables d'environnement ne le révèle pas.
 *
 *   pnpm tsx seed/hacher.ts 'mon mot de passe'
 */
import { hacher } from '../src/auth/motDePasse'

const motDePasse = process.argv[2]

if (!motDePasse) {
  console.error("Usage : pnpm tsx seed/hacher.ts 'mon mot de passe'")
  console.error('Les guillemets simples permettent les espaces et les accents.')
  process.exit(2)
}

if (motDePasse.length < 10) {
  console.error(
    `Mot de passe trop court (${motDePasse.length} caractères).\n` +
      `Le studio pourra écrire dans le bucket et republier le corpus :\n` +
      `viser au moins douze caractères, ou trois mots sans rapport.`,
  )
  process.exit(1)
}

console.log('\nSTUDIO_MOT_DE_PASSE_HACHE=' + (await hacher(motDePasse)) + '\n')
console.log('À coller dans apps/studio/.env.local et dans les variables Vercel.')
console.log("L'ancienne variable STUDIO_MOT_DE_PASSE peut être supprimée.\n")
