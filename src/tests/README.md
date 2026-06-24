# ZZAdmin 前端测试指南

## 测试框架介绍

本项目使用 [Vitest](https://vitest.dev/) 作为前端测试框架，结合 [Jest](https://jestjs.io/) 风格的API和 [Vue Test Utils](https://test-utils.vuejs.org/) 进行Vue组件测试。

## 测试文件结构

```
src/
├── tests/                 # 测试文件目录
│   ├── app.test.js        # 主测试文件
│   ├── setup.js           # 测试环境设置
│   └── README.md          # 测试指南
├── utils/
│   ├── storage-test.js    # 存储工具测试
│   ├── app-tests.js       # 功能测试脚本
│   └── ...
public/
└── test-runner.html       # 浏览器测试页面
```

## 运行测试的方法

### 方法一：使用命令行工具（推荐）

项目根目录下提供了 `run_tests.js` 脚本，方便运行测试：

```bash
# 运行所有测试
node run_tests.js

# 运行测试并生成覆盖率报告
node run_tests.js --coverage

# 在浏览器中打开测试页面
node run_tests.js --browser

# 查看帮助信息
node run_tests.js --help
```

### 方法二：直接使用 npm 命令

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 方法三：浏览器中手动测试

1. 确保前端开发服务器已启动：`npm run dev`
2. 在浏览器中访问：http://localhost:5173/test-runner.html
3. 点击页面上的测试按钮运行相应的测试

## 测试内容

### 1. 存储工具测试

- localStorage的set、get、remove操作
- 处理null、undefined等特殊值
- 非JSON字符串的处理
- 存储容量限制的异常处理

### 2. 认证功能测试

- 检查用户认证状态
- 模拟登录和注销流程
- token和用户信息的存储与读取

### 3. 响应式布局测试

- 检测不同屏幕尺寸下的布局变化
- 侧边栏展开/折叠功能
- 导航菜单的响应式表现

### 4. 路由导航测试

- 基于用户认证状态的路由守卫
- 页面间的跳转逻辑
- 404页面的处理

## 查看测试覆盖率报告

运行覆盖率测试后，可以通过以下方式查看报告：

```bash
# 使用serve工具查看HTML覆盖率报告
npx serve coverage

# 或直接打开生成的HTML文件
# coverage/index.html
```

## 编写新的测试用例

如果需要添加新的测试用例，请按照以下步骤：

1. 在 `src/tests/` 目录下创建新的测试文件，命名规则为 `*.test.js`
2. 使用Vitest的API编写测试用例，参考已有的 `app.test.js`
3. 如需在浏览器中测试，可在 `app-tests.js` 中添加测试函数，并在 `test-runner.html` 中添加对应的调用按钮

## 注意事项

1. 运行测试前请确保所有依赖已安装：`npm install`
2. 测试过程中会清空localStorage和sessionStorage，请确保重要数据已备份
3. 如遇到测试环境问题，请检查 `setup.js` 中的全局模拟配置
4. 测试覆盖率报告显示的未覆盖代码，可能是由于测试用例未覆盖到的边缘情况

## 常见问题解决

- **问题**: 测试报错 "ReferenceError: window is not defined"
  **解决**: 确保已在 `vite.config.js` 中设置了 `environment: 'jsdom'`

- **问题**: 组件测试时无法找到Element Plus组件
  **解决**: 可能需要在测试文件中手动导入所需的Element Plus组件

- **问题**: 测试覆盖率报告为空
  **解决**: 检查 `vite.config.js` 中的 `coverage.include` 配置是否正确

---

希望本指南能帮助您顺利进行前端功能测试！如有其他问题，请联系开发团队。