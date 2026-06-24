import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import eslintJs from '@eslint/js'

export default [
  // 全局配置
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // 基本规则 ? 'indent' : ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  },
  // Vue规则
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    rules: {
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
      }]
    }
  },
  // JavaScript基础规则
  eslintJs.configs.recommended
]