module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'dist',
    '**/__generated__/**',
    'coverage/**',
    'test-results/**',
    'node_modules/**',
    '**/*.ts',
    '**/*.tsx',
  ],
};
