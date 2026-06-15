import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, globalIgnores } from 'eslint/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

export default defineConfig([
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'node_modules/**',
  ]),
])
