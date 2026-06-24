const path = require('path')

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    commonjs: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-standard'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    parser: '@babel/eslint-parser'
  },
  plugins: ['vue'],
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'no-console': 'warn',
    'no-debugger': 'warn',
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-components': 'warn',
    'vue/no-unused-vars': 'warn',
    'vue/attribute-hyphenation': ['error', 'always'],
    'vue/html-self-closing': ['error', {
      html: {
        void: 'never',
        normal: 'never',
        component: 'always'
      },
      svg: 'always',
      math: 'always'
    }],
    'vue/no-mutating-props': 'warn'
  },
  ignorePatterns: [
    '**/cypress/**',
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**'
  ]
}