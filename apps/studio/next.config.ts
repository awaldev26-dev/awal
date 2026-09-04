import type { NextConfig } from 'next'

const config: NextConfig = {
  // Le build écrit ailleurs que le serveur de développement : lancer les deux
  // en parallèle écrasait sinon les fichiers servis, et la page perdait son CSS.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // Un yarn.lock traîne dans le dossier personnel : sans cette ligne, Next le
  // prend pour la racine du projet et le signale à chaque démarrage.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  transpilePackages: ['@awal/corpus'],
  serverExternalPackages: ['postgres'],
  webpack: (config) => {
    // Le monorepo importe en « ./x.js » des fichiers sources « ./x.ts ».
    // tsc et Vitest le résolvent seuls ; webpack a besoin qu'on le lui dise.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

export default config
