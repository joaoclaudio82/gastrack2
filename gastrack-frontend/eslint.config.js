import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { configs as ngConfigs, processInlineTemplates } from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';
import { configs as jsoncConfigs } from 'eslint-plugin-jsonc';
import globals from 'globals';
import { config, configs as tsConfigs } from 'typescript-eslint';

export default config(
  { ignores: ['.angular/*', 'dist/*', '.claude/*'] },
  {
    files: ['**/*.js'],
    extends: [eslint.configs.recommended, prettierConfig],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {},
  },
  {
    files: ['e2e/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tsConfigs.strictTypeChecked,
      ...tsConfigs.stylisticTypeChecked,
      prettierConfig,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: './tsconfig.e2e.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-definitions': 'off',
      'no-empty-pattern': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', 'e2e/**'],
    extends: [
      eslint.configs.recommended,
      ...tsConfigs.strictTypeChecked,
      ...tsConfigs.stylisticTypeChecked,
      ...ngConfigs.tsRecommended,
      prettierConfig,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // Disable false positives for Angular patterns
      '@typescript-eslint/unbound-method': 'off', // Angular Validators
      '@typescript-eslint/no-extraneous-class': 'off', // Empty components are valid
      '@typescript-eslint/no-empty-function': 'off', // ControlValueAccessor methods
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-deprecated': 'warn', // Warn instead of error
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...ngConfigs.templateRecommended, ...ngConfigs.templateAccessibility, prettierConfig],
    rules: {},
  },
  {
    files: ['**/*.json'],
    extends: [...jsoncConfigs['flat/recommended-with-jsonc'], ...jsoncConfigs['flat/prettier']],
    rules: {},
  },
  {
    files: ['src/**/*.spec.ts'],
    extends: [
      eslint.configs.recommended,
      ...tsConfigs.strictTypeChecked,
      ...tsConfigs.stylisticTypeChecked,
      vitest.configs.recommended,
      prettierConfig,
    ],
    languageOptions: {
      globals: vitest.environments.env.globals,
      parserOptions: {
        project: './tsconfig.spec.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    rules: {},
  },
);
