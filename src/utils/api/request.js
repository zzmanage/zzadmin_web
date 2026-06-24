// src/utils/request.js - HTTP请求工具，实现无感刷新Token机制
import axios from 'axios'
import { useUserStore } from '../../store/user'
import config from '../../config'
import { setSessionStorage } from '../common/storage-utils'
import { ElMessage } from 'element-plus'

// 根据当前环境获取基础URL
const baseURL = config.env === 'production' ? config.baseApi : 
  (config.mock ? config.mockApi : config.baseApi)

// 创建 axios 实例
const service = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  withCredentials: true
})

// 内部状态管理
const state = {
  isRefreshing: false,
  refreshTokenFailCount: 0,
  requestsQueue: []
}

/**
 * 获取cookie中的CSRF令牌
 * @returns {string|null} CSRF令牌或null
 */
function getCSRFToken() {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    .split('=')[1]
  return cookieValue ? decodeURIComponent(cookieValue) : null
}

/**
 * 处理Token刷新失败逻辑
 * @param {Error} error 刷新失败的错误对象
 */
function handleRefreshFailure(error) {
  // 清空等待队列
  state.requestsQueue = []
  
  // 保存当前页面的URL，以便登录后能够返回到原来的页面
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  if (currentPath && currentPath !== '/login') {
    setSessionStorage('redirectAfterLogin', currentPath)
  }
  
  // 分析错误原因，提供更具体的错误信息
  let errorMessage = '您的登录已过期'
  let detailedMessage = ''
  
  if (error.response.data.detail) {
    detailedMessage = error.response.data.detail
    if (detailedMessage.includes('token_not_valid')) {
      errorMessage = '您的会话已过期，请重新登录'
    } else if (detailedMessage.includes('invalid')) {
      errorMessage = '无效的认证信息，请重新登录'
    } else if (detailedMessage.includes('expired')) {
      errorMessage = '您的登录已过期，请重新登录'
    }
  } else if (error.message) {
    detailedMessage = error.message
  }
  
  // 输出错误日志
  console.error('刷新Token失败:', errorMessage + (detailedMessage ? ': ' + detailedMessage : ''))
  
  // 退出登录并清除认证信息
  const userStore = useUserStore()
  userStore.logout()
  
  // 显示错误消息
  ElMessage.error(errorMessage)
  
  // 直接跳转到登录页面，使用replace方法防止用户返回
  if (typeof window !== 'undefined') {
    window.location.replace('/login')
    // 确保即使在某些特殊情况下也能重定向
    setTimeout(() => {
      window.location.href = '/login'
    }, 100)
  }
  
  return Promise.reject(error)
}

/**
 * 刷新Token
 * @param {string} refreshToken 当前的刷新Token
 * @returns {Promise} 刷新结果
 */
async function refreshToken(refreshToken) {
  try {
    // 修复URL路径问题，移除URL中的baseURL拼接
    // 直接使用service实例来避免URL拼接问题
    const response = await service.post(
      'api/token/refresh/',
      { refresh: refreshToken },
      { timeout: 5000 }
    )
    return response
  } catch (error) {
    console.error('刷新Token请求失败:', error)
    throw error
  }
}

// 请求拦截器
service.interceptors.request.use(
  (request) => {
    const userStore = useUserStore()
    
    // 添加JWT认证头部
    if (userStore.token && request.headers) {
      request.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    
    // 添加租户ID头部
    if (userStore.tenantId && request.headers) {
      request.headers['X-Tenant-ID'] = userStore.tenantId
    }
    
    // 添加CSRF令牌头部（对于非GET请求）
    if (request.method && request.method.toUpperCase() !== 'GET' && request.headers) {
      const csrfToken = getCSRFToken()
      if (csrfToken) {
        request.headers['X-CSRFToken'] = csrfToken
      }
    }
    
    return request
  },
  (error) => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 返回完整的响应对象，而不只是data字段
    // 这样可以确保所有API模块都能获取到完整的响应数据
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const userStore = useUserStore()

    // 处理 401 错误，尝试刷token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // 重要：如果是登录页面的请求，直接返回错误，不尝试刷新Token
      if (originalRequest.url && originalRequest.url.includes('/api/auth/login/')) {
                return Promise.reject(error)
      }
      
      // 如果正在刷新 token，则将请求加入队列
      if (state.isRefreshing) {
        return new Promise((resolve) => {
          state.requestsQueue.push((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            resolve(service(originalRequest))
          })
        })
      }
      
      originalRequest._retry = true
      state.isRefreshing = true
      
      try {
        // 使用 refresh token 刷新 access token
        const response = await refreshToken(userStore.refreshToken)
        
        // 检查响应数据
        if (!response || !response.data || !response.data.access) {
          throw new Error('刷新Token失败：无效的响应数据')
        }
        
        const newAccessToken = response.data.access
        const newRefreshToken = response.data.refresh || userStore.refreshToken
        
        // 更新 store 和本地存储中token
        userStore.updateToken(newAccessToken, newRefreshToken)
        
        // 重置失败计数
        state.refreshTokenFailCount = 0
        
        // 重新设置请求头中token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        
        // 处理队列中的请求
        state.requestsQueue.forEach(callback => callback(newAccessToken))
        state.requestsQueue = []
        
        // 重试当前请求
        return service(originalRequest)
      } catch (refreshError) {
        // 增加失败计数
        state.refreshTokenFailCount++
                
        // 如果失败次数达到3次或任何单次失败，都重定向到登录页面
        return handleRefreshFailure(refreshError)
      } finally {
        state.isRefreshing = false
      }
    }
    
    // 处理其他错误
    if (error.response) {
      console.error('响应错误状态:', error.response.status)
      console.error('响应错误数据:', error.response.data)
    } else if (error.request) {
      console.error('网络超时错误:', error)
    }
    
    return Promise.reject(error)
  }
)

export default service
