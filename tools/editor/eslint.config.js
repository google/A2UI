import gts from 'gts';

const customConfig = [
  {
    ignores: ['dist', 'node_modules', '.wireit', '**/*.d.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'lines-between-class-members': ['error', 'always', {exceptAfterSingleLine: true}],
      quotes: ['error', 'single', {avoidEscape: true, allowTemplateLiterals: true}],
    },
  },
];

export default [...gts, ...customConfig];
