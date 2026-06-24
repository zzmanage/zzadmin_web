import { defineConfig, splitVendorChunkPlugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // 项目根目录
  root: process.cwd(),
  // 缓存目录，提高二次构建速度
  cacheDir: 'node_modules/.vite_cache',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    // 减少resolve优化
    conditions: ['browser', 'module', 'es2015'],
    // 扩展省略列表
    extensions: ['.vue', '.js', '.jsx', '.ts', '.tsx']
  },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      // 配置自动导入目录
      dirs: ['src/composables'],
      // 配置全局导入，减少重复导入
      imports: ['vue', 'vue-router', 'pinia'],
      // 生成.d.ts声明文件
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      // 配置组件目录
      dirs: ['src/components'],
      // 生成组件声明文件
      dts: 'src/components.d.ts'
    }),
  ],
  // 配置依赖预构建
  optimizeDeps: {
    // 要预构建的依赖
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      '@element-plus/icons-vue',
      '@ant-design/icons-vue',
      'axios',
      'echarts'
    ],
    // 排除不需要预构建的依赖
    exclude: [],
    // 强制预构建所有依赖
    force: false,
    // 配置预构建的esbuild选项
    esbuildOptions: {
      target: 'es2015',
      plugins: []
    }
  },
  // 构建优化配置
  build: {
    // 输出目录
    outDir: 'dist',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成源映射
    sourcemap: false,
    // 目标浏览器配置
    target: ['es2015'],
    // 启用 brotli 压缩
    brotliSize: true,
    // 调整块大小警告限制
    chunkSizeWarningLimit: 1000,
    // 配置哪些包不需要外部化
    noExternal: ['element-plus', '@element-plus/icons-vue'],
    // 配置要内联的模块大小阈值
    assetsInlineLimit: 4096,
    // Rollup 配置
    rollupOptions: {
      output: {
        // 配置手动代码分割
        manualChunks: {
          // 第三方库分割
          vue: ['vue', 'vue-router', 'pinia'],
          element: ['element-plus', '@element-plus/icons-vue'],
          antd: ['@ant-design/icons-vue'],
          axios: ['axios'],
          echarts: ['echarts']
        },
        // 自定义分块策略
        onwarn: (warning, warn) => {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return
          }
          warn(warning)
        },
        // 配置输出格式
        format: 'esm',
        // 配置入口文件命名格式
        entryFileNames: 'assets/[name].[hash].js',
        // 配置块文件命名格式
        chunkFileNames: 'assets/[name].[hash].js',
        // 配置资源文件命名格式
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
      // 配置插件
      plugins: [
        // 可视化打包结果
        visualizer({
          filename: './dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true
        }),
        // 分割vendor代码
        splitVendorChunkPlugin()
      ]
    },
    // 配置 esbuild 优化
    esbuild: {
      // 配置目标环境
      target: 'es2015',
      // 配置压缩选项
      minify: true,
      // 配置ts编译选项
      tsconfigRaw: 'esnext',
      // 配置jsx自动注入
      jsxInject: 'import { h } from \'vue\'',
      // 配置多线程构建
      maxWorkers: 4
    },
    // 配置terser优化
    terserOptions: {
      compress: {
        // 移除console
        drop_console: true,
        // 移除debugger
        drop_debugger: true,
        // 合并变量
        collapse_vars: true,
        // 提取静态值
        reduce_vars: true
      },
      format: {
        // 移除注释
        comments: false,
        // 美化输出
        beautify: false
      }
    },
  },
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
      exclude: ['src/main.js', 'src/router/**', 'src/store/**']
    },
    // 模拟全局变量
    global: true,
    // 设置测试文件的转换
    transformMode: {
      web: [/\.vue$/, /\.tsx?$/]
    },
    // 测试设置文件
    setupFiles: ['./src/tests/setup.js'],
    // 转换CSS文件
    css: {
      transform: true
    },
    // 支持CommonJS模块
    deps: {
      optimizer: {
        web: {
          enabled: true
        }
      },
      // 处理CSS文件的转换
      transform: {
        '^.+\\.css$': 'identity-obj-proxy'
      }
    }
  },
  // 添加代理配置解决跨域问题
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
        // 移除rewrite，保持完整路径
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/captcha': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
