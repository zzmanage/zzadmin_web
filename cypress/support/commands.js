// 自定义Cypress命令

// 登录命令
Cypress.Commands.add('login', (username, password, captcha = '1234') => {
  cy.visit('/login')
  
  // 拦截登录请求，模拟成功响应
  cy.intercept('POST', '/auth/login/', {
    statusCode: 200,
    body: {
      username: username,
      access: 'mock_access_token',
      refresh: 'mock_refresh_token',
      user_id: 1
    }
  })
  
  // 输入用户名、密码和验证码
  cy.get('input[placeholder="用户名"]').type(username)
  cy.get('input[placeholder="密码"]').type(password)
  cy.get('input[placeholder="验证码"]').type(captcha)
  
  // 点击登录按钮
  cy.get('button').contains('登录').click()
  
  // 验证登录成功，重定向到dashboard
  cy.url().should('include', '/dashboard')
})

// 登出命令
Cypress.Commands.add('logout', () => {
  cy.get('.user-dropdown').click()
  cy.contains('退出登录').click()
  // 验证登出成功，重定向到登录页
  cy.url().should('include', '/login')
})

// 获取认证令牌
Cypress.Commands.add('getAuthToken', () => {
  return cy.window().then(win => {
    return win.localStorage.getItem('auth_token') || win.sessionStorage.getItem('auth_token')
  })
})

// 设置认证令牌
Cypress.Commands.add('setAuthToken', (token) => {
  cy.window().then(win => {
    win.sessionStorage.setItem('auth_token', token)
  })
})

// 检查元素是否可见并包含指定文本
Cypress.Commands.add('shouldBeVisibleAndContain', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).should('be.visible').and('contain', text)
})

// 等待API请求完成
Cypress.Commands.add('waitForApi', (route) => {
  cy.intercept(route).as('apiRequest')
  cy.wait('@apiRequest').its('response.statusCode').should('eq', 200)
})

// 导航到指定菜单项
Cypress.Commands.add('navigateTo', (menuItem) => {
  cy.contains('.el-menu-item', menuItem).click()
})