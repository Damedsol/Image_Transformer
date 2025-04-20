import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import js from '@eslint/js';

export default [
  // Configuración base de ESLint
  js.configs.recommended,

  // Configuración TypeScript
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedRequiringTypeChecking,
  {
    // Opciones para la verificación de tipos
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    // Patrones de archivos ignorados
    ignores: ['dist/**', 'node_modules/**', '.vscode/**', 'build/**', '**/*.log', '**/*.lock'],
  },

  // Configuración específica para archivos TypeScript
  {
    files: ['**/*.ts'],
    rules: {
      // Reglas de TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/unbound-method': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/require-await': 'error',

      // Reglas JavaScript generales
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
    },
  },

  // Configuración para prettier
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': ['error'],
    },
  },

  // Esta configuración debe ir al final para desactivar reglas que entren en conflicto con prettier
  eslintConfigPrettier,
];
