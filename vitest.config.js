/**
 * Vitest configuration.
 * Vitest does not read the "vitest" key in package.json, so the coverage
 * thresholds live here; CI fails when coverage drops below them.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      // Server entry point: only calls app.listen(), not imported by tests
      exclude: ['src/index.js'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
})
