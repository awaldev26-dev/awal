import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
  },
  resolve: {
    alias: { '@': new URL('./src/', import.meta.url).pathname },
  },
})
