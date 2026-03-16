/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'vue/multi-word-component-names': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.vue'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    {
      files: ['src/views/Dashboard.vue', 'src/views/Login.vue'],
      rules: { 'vue/multi-word-component-names': 'off' },
    },
  ],
};
