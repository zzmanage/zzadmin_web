// 环境配置文件
export default {
  // 当前环境：development, production, test
  env: import.meta.env.MODE || 'development',
  // 基础API URL - 移除'/api'后缀，因为代理配置会自动添加
  baseApi: import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000',
  // Mock API URL
  mockApi: 'http://localhost:8000/mock',
  // 是否使用mock数据
  mock: false
}