import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Configuración base de ESLint
  js.configs.recommended,

  // Configuración TypeScript
  ...tseslint.configs.recommended,

  {
    // Configuración general
    ignores: [
      'dist/**',
      'node_modules/**',
      '.vscode/**',
      'build/**',
      '**/*.log',
      '**/*.lock',
      'public/**',
      'backend/**',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
    },
  },

  // Configuración específica para archivos TypeScript con verificación de tipos
  {
    files: ['src/**/*.{ts,tsx}'],
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
    rules: {
      // Reglas de TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Reglas JavaScript generales
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },

  // Configuración para archivos JavaScript (como archivos de configuración)
  {
    files: ['*.js'],
    languageOptions: {
      sourceType: 'module',
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
