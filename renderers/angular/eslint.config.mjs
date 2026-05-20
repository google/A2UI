import gts from 'gts';
import stylistic from '@stylistic/eslint-plugin';

const customConfig = [
  {
    ignores: [
      'dist',
      'node_modules',
      '.wireit',
      '**/*.d.ts',
      '**/generated/**',
      '*.js',
      '*.mjs',
      '*.conf.js',
    ],
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@stylistic/lines-between-class-members': [
        'error',
        'always',
        {exceptAfterSingleLine: true},
      ],
      'quotes': [
        'error',
        'single',
        {avoidEscape: true, allowTemplateLiterals: true},
      ],
    },
  },
];

export default [...gts, ...customConfig];
