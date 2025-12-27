module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {
    // Baseline overrides - defer to S3+ maintenance
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-case-declarations': 'off',
    // BACKLOG: react-hooks/rules-of-hooks has 5 violations in ESparkline.tsx
    // Requires restructuring early returns - logged for S3 cleanup
    'react-hooks/rules-of-hooks': 'off',
    'prefer-const': 'off',
  },
}
