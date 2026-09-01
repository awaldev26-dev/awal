import type { NextConfig } from 'next'

const config: NextConfig = {
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
