import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-types/**',
      'coverage/**',
      'node_modules/**',
      'examples/**',
      'react-example/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // The client deliberately accepts loosely-typed API payloads at the edges.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // A named catch binding is worth keeping even when unused - it is the
          // first thing you reach for when debugging a failing branch.
          caughtErrors: 'none',
        },
      ],
      // `interface ThreadsContext extends RequestContext {}` is deliberate: every
      // endpoint gets its own named context type so its shape can diverge later
      // without a breaking rename. Still flags a bare `{}` type.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      // Conflicts with the discriminated-union class-field idiom used across
      // message.ts (`type: 'text' = 'text'`), which `as const` would make readonly.
      '@typescript-eslint/prefer-as-const': 'off',
      // Debug logging is a documented feature, gated behind the `debug` option.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // Tests mock aggressively and assert on loose shapes.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
  // Must stay last so formatting rules never conflict with Prettier.
  prettier
);
