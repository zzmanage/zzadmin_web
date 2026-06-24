// 导入Cypress命令
import './commands'

// 导入Element Plus样式，使测试环境中的组件样式与实际环境一致
import 'element-plus/dist/index.css'

// 全局配置
Cypress.on('uncaught:exception', (err, runnable) => {
  // 忽略一些非关键错误
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Cannot read properties of undefined')) {
    return false
  }
  // 其他错误继续抛出
  return true
})

// 在每个测试前运行
beforeEach(() => {
  // 清除localStorage和sessionStorage
  cy.clearLocalStorage()
  cy.clearSessionStorage()
})

// 在每个测试后运行
afterEach(() => {
  // 可以在这里添加测试后的清理操作
})