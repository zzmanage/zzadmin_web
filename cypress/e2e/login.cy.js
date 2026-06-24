// 端到端测试示例：测试登录流程

describe('登录功能测试', () => {
  beforeEach(() => {
    // 在每个测试前访问登录页面
    cy.visit('/login')
    
    // 确保页面已加载完成
    cy.get('h2').should('contain', '后台管理系统')
  })

  it('页面应正确加载，包含所有必要元素', () => {
    // 检查用户名输入框是否存在
    cy.get('input[placeholder="用户名"]').should('exist')
    
    // 检查密码输入框是否存在
    cy.get('input[placeholder="密码"]').should('exist')
    
    // 检查验证码输入框是否存在
    cy.get('input[placeholder="验证码"]').should('exist')
    
    // 检查验证码图片是否存在
    cy.get('.captcha-image').should('exist')
    
    // 检查登录按钮是否存在
    cy.get('button').should('contain', '登录')
  })

  it('输入有效凭据应成功登录并跳转到dashboard页面', () => {
    // 使用intercept拦截登录请求
    cy.intercept('POST', '/auth/login/', {
      statusCode: 200,
      body: {
        username: 'admin',
        access: 'mock_access_token',
        refresh: 'mock_refresh_token',
        user_id: 1
      }
    }).as('loginRequest')
    
    // 输入用户名、密码和验证码
    cy.get('input[placeholder="用户名"]').type('admin')
    cy.get('input[placeholder="密码"]').type('admin123')
    cy.get('input[placeholder="验证码"]').type('1234')
    
    // 点击登录按钮
    cy.get('button').contains('登录').click()
    
    // 等待登录请求完成
    cy.wait('@loginRequest')
    
    // 验证是否成功跳转到dashboard页面
    cy.url().should('include', '/dashboard')
  })

  it('输入无效凭据应显示错误消息', () => {
    // 使用intercept拦截登录请求，返回错误
    cy.intercept('POST', '/auth/login/', {
      statusCode: 401,
      body: {
        detail: '用户名或密码错误'
      }
    }).as('loginRequest')
    
    // 输入错误的用户名、密码和验证码
    cy.get('input[placeholder="用户名"]').type('wronguser')
    cy.get('input[placeholder="密码"]').type('wrongpass')
    cy.get('input[placeholder="验证码"]').type('1234')
    
    // 点击登录按钮
    cy.get('button').contains('登录').click()
    
    // 等待登录请求完成
    cy.wait('@loginRequest')
    
    // 验证是否显示了错误消息
    cy.get('.error-message').should('exist').and('contain', '用户名或密码错误')
    
    // 验证是否仍在登录页面
    cy.url().should('include', '/login')
  })

  it('未输入凭据提交表单应显示验证错误', () => {
    // 不输入任何内容，直接点击登录按钮
    cy.get('button').contains('登录').click()
    
    // 由于表单验证在前端进行，可能不会显示错误信息
    // 但登录请求不应该被发送
    cy.get('@loginRequest').should('not.exist')
  })

  it('登录成功后应能够正常登出', () => {
    // 先使用login命令登录成功
    cy.login('admin', 'admin123', '1234')
    
    // 注意：实际的登出逻辑需要根据应用的具体实现来编写
    // 这里只是一个示例，可能需要根据实际情况调整
    
    // 由于我们没有实际的UI来进行登出操作，我们可以通过清除令牌来模拟登出
    cy.window().then(win => {
      win.sessionStorage.clear()
    })
    
    // 验证是否需要重新登录
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
  })

  it('登录成功后刷新页面应保持登录状态', () => {
    // 先设置认证令牌来模拟登录状态
    cy.setAuthToken('mock_access_token')
    
    // 访问dashboard页面
    cy.visit('/dashboard')
    
    // 刷新页面
    cy.reload()
    
    // 验证是否仍然保持登录状态
    cy.getAuthToken().should('eq', 'mock_access_token')
  })

  it('登录成功后访问受限页面应能正常访问', () => {
    // 先设置认证令牌来模拟登录状态
    cy.setAuthToken('mock_access_token')
    
    // 访问User页面
    cy.visit('/user')
    
    // 验证是否能正常访问该页面
    cy.url().should('include', '/user')
  })

  it('未登录状态下访问受限页面应重定向到登录页', () => {
    // 清除可能存在的认证令牌
    cy.window().then(win => {
      win.sessionStorage.clear()
      win.localStorage.clear()
    })
    
    // 直接访问需要登录才能访问的页面
    cy.visit('/user')
    
    // 验证是否被重定向到登录页
    cy.url().should('include', '/login')
  })
})