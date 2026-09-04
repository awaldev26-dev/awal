import type { NextConfig } from 'next'

const config: NextConfig = {
  // Un yarn.lock traîne dans le dossier personnel : sans cette ligne, Next le
  // prend pour la racine du projet et le signale à chaque démarrage.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  transpilePackages: ['@awal/corpus'],
  serverExternalPackages: ['postgres'],
  // Turbopack, activé par défaut depuis Next 16. Aucune option n'est
  // nécessaire : les imports internes n'ont plus d'extension, il n'y a donc
  // plus rien à réécrire — c'était le rôle de l'ancienne config webpack.
  turbopack: {},
}

export default config
