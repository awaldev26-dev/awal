import type { NextConfig } from 'next'

const config: NextConfig = {
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
