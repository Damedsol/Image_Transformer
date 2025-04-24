import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Configuración base de ESLint
  js.configs.recommended,

  // Configuración TypeScript base (RECOMENDADA - sin verificación de tipos por defecto)
  ...tseslint.configs.recommended,
  // Nota: Las reglas que requieren tipos se activarán en las secciones específicas
  // que definen 'parserOptions.project'.

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
      // Eliminamos backend/** de ignores globales
    ],
  },

  // Configuración específica para archivos TypeScript del FRONTEND (src)
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json', // TSConfig para el frontend
      },
      globals: {
        ...globals.browser, // Globales para el navegador
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Reglas específicas del frontend (si las hubiera)
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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'prettier/prettier': ['error'], // Incluir Prettier aquí
    },
  },

  // Configuración específica para archivos TypeScript del BACKEND (backend/src)
  {
    files: ['backend/src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './backend/tsconfig.json', // TSConfig para el backend
      },
      globals: {
        ...globals.node, // Globales para Node.js
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Reglas específicas del backend (si las hubiera)
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
      // Podrías querer reglas diferentes aquí, por ejemplo, permitir console
      'no-console': 'off', // Permitir console en el backend
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'prettier/prettier': ['error'], // Incluir Prettier aquí
    },
  },

  // Configuración para archivos JavaScript (como archivos de configuración)
  {
    files: ['*.js', '*.cjs'], // Asegurarse de incluir cjs si usas CommonJS
    languageOptions: {
      sourceType: 'module', // O 'commonjs' si es necesario
      globals: {
        ...globals.node, // Globales de Node para archivos JS de config
      },
    },
  },

  // Esta configuración debe ir al final para desactivar reglas que entren en conflicto con prettier
  eslintConfigPrettier,
];
