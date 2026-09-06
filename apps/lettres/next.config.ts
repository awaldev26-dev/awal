import type { NextConfig } from 'next'

const config: NextConfig = {
  turbopack: {},
  // Un yarn.lock traîne dans le dossier personnel : sans cette ligne, Next le
  // prend pour la racine du projet et le signale à chaque démarrage.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  output: 'export',
  images: { unoptimized: true },
}

export default config
