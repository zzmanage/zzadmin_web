# 前端项目测试指南

本文档详细介绍了前端项目中集成的测试方案，包括单元测试、组件测试和端到端测试，以及如何运行和编写这些测试。

## 测试架构概览

项目采用了完整的测试金字塔架构：

- **单元测试**：测试独立的函数、工具类、API服务基类等
- **组件测试**：测试Vue组件的功能和渲染
- **端到端测试**：测试完整的用户流程

本指南包含了对API服务的测试支持，确保API服务的稳定性和可靠性。

## 测试工具栈

- **测试框架**：[Vitest](https://vitest.dev/)（用于单元测试和组件测试）
- **组件测试工具**：[@vue/test-utils](https://test-utils.vuejs.org/)、[@testing-library/vue](https://testing-library.com/vue)
- **端到端测试**：[Cypress](https://www.cypress.io/)
- **API模拟**：[MSW (Mock Service Worker)](https://mswjs.io/)
- **测试覆盖率**：内置在Vitest中的覆盖率报告

## 目录结构

```
src/
  ├── tests/
  │   ├── setup.js           # Vitest全局设置
  │   ├── msw/               # MSW相关配置
  │   │   ├── handlers.js    # API模拟处理程序
  │   │   └── setup.js       # MSW服务器设置
  │   ├── unit/              # 单元测试文件
  │   └── component/         # 组件测试文件
cypress/
  ├── e2e/                   # 端到端测试文件
  └── support/               # Cypress支持文件
      ├── commands.js        # 自定义Cypress命令
      └── e2e.js             # Cypress全局配置
```

## 运行测试

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
npm run test:all
```

### 运行单元测试

```bash
npm run test:unit
```

### 运行组件测试

```bash
npm run test:component
```

### 运行端到端测试

```bash
npm run test:e2e
```

### 运行测试并生成覆盖率报告

```bash
npm run test:coverage
```

### 打开Cypress测试界面

```bash
npm run cy:open
```

## 编写测试

### 单元测试

单元测试主要用于测试独立的函数、工具类、API服务基类等，应放在`src/tests/unit/`目录下。

**示例1**：测试认证工具函数

```javascript
import { isAuthenticated } from '../../utils/auth'

describe('认证工具函数测试', () => {
  it('当存在认证令牌时，应返回true', () => {
    // 模拟存在认证令牌
    vi.mock('../../utils/storage-utils', () => ({
      getSessionStorage: vi.fn().mockReturnValue('mock_token')
    }))
    
    // 调用被测试函数
    const result = isAuthenticated()
    
    // 验证结果
    expect(result).toBe(true)
  })
})
```

**示例2**：测试API服务基类（基于API优化方案）

```javascript
import { ApiService } from '../../utils/api/ApiService'
import { request } from '../../utils/api/request'

// 模拟request函数
vi.mock('../../utils/api/request', () => ({
  request: vi.fn()
}))

describe('ApiService基类测试', () => {
  let mockService
  
  beforeEach(() => {
    // 创建ApiService的实例
    mockService = new ApiService('/api/test')
    vi.clearAllMocks()
  })
  
  it('get方法应正确调用request并返回数据', async () => {
    const mockResponse = { data: { id: 1, name: '测试数据' } }
    request.mockResolvedValue(mockResponse)
    
    const result = await mockService.get('1')
    
    expect(request).toHaveBeenCalledWith({
      url: '/api/test/1',
      method: 'GET'
    })
    expect(result).toEqual(mockResponse)
  })
  
  it('post方法应正确调用request并返回数据', async () => {
    const mockData = { name: '新数据' }
    const mockResponse = { data: { id: 2, name: '新数据' } }
    request.mockResolvedValue(mockResponse)
    
    const result = await mockService.post(mockData)
    
    expect(request).toHaveBeenCalledWith({
      url: '/api/test',
      method: 'POST',
      data: mockData
    })
    expect(result).toEqual(mockResponse)
  })
})
```

### 组件测试

组件测试用于测试Vue组件的功能和渲染，应放在`src/tests/component/`目录下。

**示例**：测试按钮组件

```javascript
import { mount } from '@vue/test-utils'
import MyButton from '../../components/MyButton.vue'

describe('MyButton组件测试', () => {
  it('组件应正确渲染并显示文本', () => {
    const wrapper = mount(MyButton, {
      slots: {
        default: '测试按钮'
      }
    })
    
    expect(wrapper.text()).toBe('测试按钮')
  })
})
```

### 端到端测试

端到端测试用于测试完整的用户流程，应放在`cypress/e2e/`目录下。

**示例**：测试登录流程

```javascript
describe('登录功能测试', () => {
  it('输入有效凭据应成功登录并跳转到首页', () => {
    // 访问登录页面
    cy.visit('/login')
    
    // 输入用户名和密码
    cy.get('input[placeholder="用户名"]').type('admin')
    cy.get('input[placeholder="密码"]').type('admin123')
    
    // 点击登录按钮
    cy.get('button[type="submit"]').click()
    
    // 验证是否成功跳转到首页
    cy.url().should('include', '/home')
  })
})
```

## API模拟（MSW）

MSW用于在测试环境中模拟API请求，避免直接调用真实的后端接口。所有的模拟处理程序都定义在`src/tests/msw/handlers.js`文件中。

**添加新的API模拟**：

1. 打开`src/tests/msw/handlers.js`文件
2. 添加新的处理程序，例如：

```javascript
import { rest } from 'msw'

export const handlers = [
  // 现有的处理程序...
  
  // 新的API模拟
  rest.get('/api/users/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          { id: 1, name: '用户1' },
          { id: 2, name: '用户2' }
        ]
      })
    )
  }),
  
  // 针对API服务优化的模拟 - 模拟分页数据
  rest.get('/api/items/', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1'
    const pageSize = req.url.searchParams.get('pageSize') || '10'
    
    return res(
      ctx.status(200),
      ctx.json({
        data: Array.from({ length: parseInt(pageSize) }, (_, i) => ({
          id: (parseInt(page) - 1) * parseInt(pageSize) + i + 1,
          name: `项目${(parseInt(page) - 1) * parseInt(pageSize) + i + 1}`
        })),
        meta: {
          total: 100,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      })
    )
  })
]
```

## 自定义Cypress命令

项目中定义了一些自定义的Cypress命令，方便在端到端测试中使用：

- `cy.login(username, password)`: 登录用户
- `cy.logout()`: 登出用户
- `cy.getAuthToken()`: 获取认证令牌
- `cy.setAuthToken(token)`: 设置认证令牌
- `cy.shouldBeVisibleAndContain(text)`: 检查元素是否可见并包含指定文本
- `cy.waitForApi(route)`: 等待API请求完成
- `cy.navigateTo(menuItem)`: 导航到指定菜单项

**使用示例**：

```javascript
describe('用户管理测试', () => {
  beforeEach(() => {
    // 使用自定义登录命令
    cy.login('admin', 'admin123')
    
    // 使用自定义导航命令
    cy.navigateTo('用户管理')
  })
  
  it('应显示用户列表', () => {
    // 使用自定义断言命令
    cy.get('.user-list').shouldBeVisibleAndContain('用户列表')
  })
})
```

## 测试最佳实践

1. **保持测试独立**：每个测试应该独立运行，不依赖其他测试的状态
2. **测试覆盖关键路径**：优先测试用户最常使用的功能和关键业务流程
3. **使用有意义的测试名称**：测试名称应清晰地描述测试的目的
4. **合理使用mock**：对于外部依赖（如API调用、第三方库），使用mock来隔离测试
5. **编写简洁的测试**：每个测试只测试一个功能点
6. **保持测试代码和生产代码同步更新**：当生产代码更改时，相应的测试也应更新
7. **定期运行测试**：在代码提交前和CI/CD流程中运行测试
8. **API服务测试特别注意事项**：
   - 确保API服务相关的组件有充分的单元测试
   - 测试API缓存、重试和限流等高级功能的正确性
   - 模拟各种API响应场景，包括成功、失败、超时等
   - 确保API版本控制的测试覆盖

## 常见问题解答

### 测试运行缓慢怎么办？

- 对于单元测试和组件测试，可以使用`--run`参数直接运行测试，不启动监视模式
- 对于端到端测试，可以关闭视频录制功能（在cypress.config.js中设置`video: false`）

### 如何调试测试？

- 对于单元测试和组件测试，可以使用`npm run test`启动监视模式，然后使用浏览器的开发者工具进行调试
- 对于端到端测试，可以使用`npm run cy:open`打开Cypress测试界面，然后在测试运行时使用内置的调试工具

### 如何处理测试中的异步操作？

- 使用`async/await`处理异步代码
- 对于API请求，使用MSW进行模拟
- 对于DOM更新，使用Vue Test Utils提供的`flushPromises`方法

## CI/CD集成

可以将测试命令集成到CI/CD流程中，确保每次代码提交或合并前都运行测试：

```yaml
# 示例GitHub Actions配置
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '19.x'
      - run: npm ci
      - run: npm run test:all
```