import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'dist-types/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/examples/**',
        '**/docs/**',
        'tests/**',
        'react-example/**',
      ],
      include: ['src/**/*.ts'],
      all: true,
      // Ratchet: pinned just under the measured numbers under vitest 3
      // (72.87 lines / 83.07 branches / 76.78 functions) so coverage cannot
      // silently regress. Raise these as coverage improves; never lower them.
      // Note: vitest 3 remaps v8 coverage more accurately than vitest 1 did,
      // so these read lower than the old config claimed without any real
      // change in what the tests exercise.
      thresholds: {
        lines: 72,
        functions: 76,
        branches: 82,
        statements: 72,
      },
    },
  },
});
