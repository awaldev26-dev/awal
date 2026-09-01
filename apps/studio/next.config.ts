import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@awal/corpus'],
  serverExternalPackages: ['postgres'],
}

export default config
