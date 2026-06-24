import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 测试环境的Vite配置
export default defineConfig({
  plugins: [
    vue(),
  ],
  test: {
    // 使用 jsdom 作为测试环境
    environment: 'jsdom',
    // 匹配测试文件
    include: ['src/tests/**/*.[jt]s?(x)', '**/__tests__/**/*.[jt]s?(x)', '**/*(*.)@(spec|test).[jt]s?(x)'],
    // 测试覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/main.js', 'src/router/**', 'src/store/**'],
      // 明确指定HTML报告的输出目录
      html: {
        outputDir: './coverage/html-report'
      }
    },
    // 模拟全局变量
    global: true,
    // 设置测试文件的转换
    transformMode: {
      web: [/\.vue$/, /\.[jt]sx?$/]
    },
    // 测试设置文件
    setupFiles: ['./src/tests/setup.js'],
    // 处理CSS文件
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    },
    // 支持CommonJS模块
    deps: {
      optimizer: {
        web: {
          enabled: true
        }
      }
    },
    // 解析器配置
    resolve: {
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.vue', '.json'],
      alias: {
        '@': '/src'
      }
    },
    // 允许测试中使用ES模块
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: []
    }
  }
})