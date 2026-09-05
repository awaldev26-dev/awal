/**
 * Produit l'empreinte à mettre dans STUDIO_MOT_DE_PASSE_HACHE.
 *
 * Le mot de passe n'est jamais stocké : seule son empreinte scrypt l'est, si
 * bien qu'une fuite des variables d'environnement ne le révèle pas.
 *
 * Sans argument, il est demandé à la saisie et n'apparaît ni à l'écran ni dans
 * l'historique du terminal :
 *
 *   pnpm tsx seed/hacher.ts
 */
import { createInterface } from 'node:readline'
import { hacher } from '../src/auth/motDePasse'

/** Lit une ligne sans l'afficher, pour qu'un mot de passe ne reste pas visible. */
function demanderMasque(invite: string): Promise<string> {
  return new Promise((resoudre) => {
    const lecteur = createInterface({ input: process.stdin, output: process.stdout })
    const sortie = process.stdout as NodeJS.WriteStream & { muted?: boolean }

    // Neutralise l'écho : readline écrit chaque touche, on l'en empêche.
    const ecrireOriginal = sortie.write.bind(sortie)
    process.stdout.write(invite)
    sortie.write = ((morceau: string, ...reste: unknown[]) =>
      sortie.muted ? true : ecrireOriginal(morceau, ...(reste as []))) as typeof sortie.write
    sortie.muted = true

    lecteur.question('', (reponse) => {
      sortie.muted = false
      sortie.write = ecrireOriginal
      process.stdout.write('\n')
      lecteur.close()
      resoudre(reponse)
    })
  })
}

/**
 * La saisie masquée exige un vrai terminal. Sans lui — commande lancée depuis
 * un outil, un script ou une tâche planifiée — readline attend indéfiniment,
 * et le seul symptôme est un avertissement sur une promesse jamais résolue.
 */
const interactif = process.stdin.isTTY === true

if (!interactif && !process.argv[2]) {
  console.error(
    "\nCe terminal n'accepte pas de saisie masquée.\n\n" +
      'Passer le mot de passe en argument :\n' +
      "  pnpm tsx seed/hacher.ts 'mon mot de passe'\n\n" +
      "Il restera dans l'historique du shell ; « history -d » l'en retire,\n" +
      'ou lancer la commande sans argument depuis un terminal ordinaire.\n',
  )
  process.exit(2)
}

const motDePasse = process.argv[2] ?? (await demanderMasque('Mot de passe du studio : '))

if (!motDePasse) {
  console.error('Aucun mot de passe saisi.')
  process.exit(2)
}

if (motDePasse.length < 10) {
  console.error(
    `\nMot de passe trop court (${motDePasse.length} caractères).\n` +
      `Le studio pourra écrire dans le bucket et republier le corpus :\n` +
      `viser au moins douze caractères, ou trois mots sans rapport.\n`,
  )
  process.exit(1)
}

console.log('\nÀ coller dans apps/studio/.env.local et dans les variables Vercel :\n')
console.log('STUDIO_MOT_DE_PASSE_HACHE=' + (await hacher(motDePasse)))
console.log("\nL'ancienne variable STUDIO_MOT_DE_PASSE peut être supprimée.\n")
