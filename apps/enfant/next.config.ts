import type { NextConfig } from 'next'

const config: NextConfig = {
  // Un yarn.lock traîne dans le dossier personnel : sans cette ligne, Next le
  // prend pour la racine du projet et le signale à chaque démarrage.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  output: 'export',
  transpilePackages: ['@awal/corpus'],
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    }
    return config
  },
}

export default config
