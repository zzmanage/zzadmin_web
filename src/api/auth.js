import { apiGet, apiPost } from '../utils/api/apiRequestWrapper'

// 获取当前登录用户信息
export const getCurrentUser = async () => {
  return await apiGet('/api/users/me/', {}, '获取当前用户信息')
}


// 登录函数
export const login = async (credentials) => {
  // 检查credentials参数
  if (!credentials || !credentials.username || !credentials.password) {
    throw new Error('用户名和密码不能为空')
  }
  
  // 创建一个新对象，确保字段映射正确
  const requestData = {
    username: credentials.username,
    password: credentials.password,
    captcha: credentials.captcha,
    captcha_id: credentials.captchaKey // 明确映射captchaKey到captcha_id
  }
  
  // 修复URL路径，添加前导斜杠确保正确的API路径
  const response = await apiPost('/api/auth/login/', requestData, '用户登录')
    // 注意：登录信息的保存已移至Login.vue中处理，避免重复操作
  return response
}

// 刷新token
export const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error('刷新token不能为空')
  }
  
  // 保持URL路径一致性，添加前导斜杠
  const response = await apiPost('/api/token/refresh/', { refresh: refreshToken }, '刷新访问令牌')
  return response
}

// 验证token
export const verifyToken = async () => {
  // 使用已有的auth/check接口来验证用户登录状态
  const response = await apiGet('/api/auth/check/', {}, '验证访问令牌')
  return response
}
