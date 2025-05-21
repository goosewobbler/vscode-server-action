/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    /**
     * not to ESM ported packages
     */
    exclude: [
      'dist',
      'build',
      '.idea',
      '.git',
      '.cache',
      '**/node_modules/**',
      '__mocks__',
    ],
    coverage: {
      provider: 'v8',
      enabled: true,
      thresholds: {
        lines: 80,
        functions: 60,
        branches: 50,
        statements: 80,
      }
    },
  },
})
