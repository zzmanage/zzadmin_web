import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents() {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:5173', // 前端开发服务器的URL
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: false, // 关闭视频录制以提高性能
    chromeWebSecurity: false, // 允许跨域请求
    defaultCommandTimeout: 10000, // 默认命令超时时间（毫秒）
  },
})