import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import js from '@eslint/js';

export default [
  // Configuración base de ESLint
  js.configs.recommended,

  // Configuración TypeScript
  ...tseslint.configs.recommended,

  {
    // Opciones generales
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
    ignores: [
      'dist/**',
      'node_modules/**',
      '.vscode/**',
      'build/**',
      'temp/**',
      '**/*.log',
      '**/*.lock',
    ],
  },

  // Configuración específica para archivos TypeScript
  {
    files: ['**/*.ts'],
    rules: {
      // Reglas de TypeScript
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/prefer-regexp-exec': 'warn',
      '@typescript-eslint/require-await': 'warn',

      // Reglas JavaScript generales
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-unused-expressions': 'warn',
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
