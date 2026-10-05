import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'

// eslint-plugin-react-hooks v5 exposes the flat config as `recommended-latest`
// and dropped the older `configs.flat.recommended` path. Support both so the
// config keeps working across plugin majors.
const reactHooksConfig =
  reactHooks.configs['recommended-latest'] ??
  reactHooks.configs.flat?.recommended ??
  reactHooks.configs.recommended

export default defineConfig([
  globalIgnores(['dist']),
  {
    // The backend is a Node service: process, Buffer and the timers come from
    // Node, not the browser, so the browser-only globals below flag every
    // legitimate use as undefined.
    files: ['backend/**/*.js'],
    extends: [js.configs.recommended],
    plugins: { 'unused-imports': unusedImports },
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { vars: 'all', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['backend/**'],
    extends: [
      js.configs.recommended,
      reactHooksConfig,
      reactRefresh.configs.vite,
    ],
    plugins: { react, 'unused-imports': unusedImports },
    settings: { react: { version: 'detect' } },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Without these, no-unused-vars cannot see that a component referenced as
      // <Foo /> counts as a usage, and every JSX import is falsely reported as
      // unused. jsx-uses-react likewise marks the React import as used under the
      // classic runtime.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // unused-imports wraps no-unused-vars so it can *remove* dead imports
      // with --fix instead of only reporting them.
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', {
        vars: 'all',
        varsIgnorePattern: '^React$',
        ignoreRestSiblings: true,
      }],
      // Context modules intentionally export both a Provider component and a
      // useX() hook. That is the standard React pattern; splitting them would
      // only churn files for a Fast Refresh nicety.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
