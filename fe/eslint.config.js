import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist/**', '.local/**', 'coverage/**', 'test-results/**', 'playwright-report/**', '.vercel/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser }, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { 'no-unused-vars': 'off', '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }] }
  }
]

