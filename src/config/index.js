// 获取当前环境，默认开发环境
// 从环境变量中读取配置，确保与Vite的环境变量命名规范一致
const env = import.meta.env.MODE || 'development'

// 从环境变量中获取API基础URL，如果不存在则使用默认值
const VITE_APP_API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000/'

const EnvConfig = {
  development: {
    baseApi: VITE_APP_API_BASE_URL,
    mockApi: ''
  },
  test: {
    baseApi: VITE_APP_API_BASE_URL,
    mockApi: ''
  },
  production: {
    baseApi: VITE_APP_API_BASE_URL,
    mockApi: ''
  }
}

export default {
  env,
  mock: false,
  ...EnvConfig[env]
}

