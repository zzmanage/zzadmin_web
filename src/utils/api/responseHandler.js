// 响应处理工具模块 - 统一处理API响应和错误
import { ElMessage } from 'element-plus'

/**
 * 统一处理API响应
 * @param {object} response API响应对象
 * @returns {any} 处理后的数据或错误 */
export const handleResponse = (response) => {
  if (!response) {
    throw new Error('无效的响应数据')
  }

  // 检查响应是否成功
  if (isResponseSuccess(response)) {
    // 直接返回extractData处理后的数据
    // extractData现在直接返回实际数据，不再包装在data字段中
    return extractData(response)
  }

  // 处理错误响应
  return handleApiError(response)
}

/**
 * 处理API错误
 * @param {object} response 错误响应对象
 * @returns {Promise} 包含错误信息的Promise
 */
export const handleApiError = (response) => {
  const error = new Error('API请求失败')
  
  // 设置错误信息 - 优先使用统一响应格式
  if (response && response.data) {
    // 直接使用统一响应格式的错误信息
    error.message = response.data.message || response.data.msg || '未知错误'
    error.code = response.data.code !== undefined ? response.data.code : response.status
    error.details = response.data.data || response.data
  } else if (response && response.status) {
    error.message = `HTTP错误 ${response.status}`
    error.code = response.status
  }

  // 显示错误信息
  const errorMessage = error.message || '操作失败，请重试'
  
  // 处理常见错误类型
  switch (error.code) {
    case 401:
      ElMessage.error('您的登录已过期，请重新登录')
      break
    case 403:
      ElMessage.error('权限不足，无法执行此操作')
      break
    case 404:
      ElMessage.error('请求的资源不存在')
      break
    case 500:
      ElMessage.error('服务器内部错误，请稍后重试')
      break
    default:
      ElMessage.error(errorMessage)
  }

  throw error
}

/**
 * 从响应中提取数据
 * @param {object} response API响应对象
 * @returns {any} 提取的数据
 */
export const extractData = (response) => {
  // 基本防御性检查
  if (!response || !response.data) {
    return null
  }

  // 优先处理后端统一响应格式 {code, message, data}
  if (typeof response.data === 'object' && 
      'code' in response.data && 
      'message' in response.data && 
      'data' in response.data) {
    return response.data.data
  }

  // 保持简单的兼容性处理
  if (typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data
  }

  // 对于不符合统一格式的情况，返回原始数据
  return response.data
}

/**
 * 检查响应是否成功
 * @param {object} response API响应对象
 * @returns {boolean} 是否成功
 */
export const isResponseSuccess = (response) => {
  // 基本防御性检查
  if (!response) {
    return false
  }
  
  // 优先检查后端统一响应格式的code字段
  if (response.data && typeof response.data === 'object' && response.data.code === 0) {
    return true
  }
  
  // 保留HTTP状态码检查作为基本保障
  return response.status >= 200 && response.status < 300
}

/**
 * 处理API响应的统一错误处理（与api-utils.js整合）
 * @param {Object} response - API响应对象
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回处理后的响应
 */
export const handleApiResponse = (response, options = {}) => {
  const { successMessage = '', errorMessage = '操作失败' } = options
  
  return new Promise((resolve, reject) => {
    if (response && isResponseSuccess(response)) {
      if (successMessage) {
        ElMessage.success(successMessage)
      }
      // 直接使用extractData返回的数据，不再需要额外处      resolve(extractData(response))
    } else {
      // 处理错误情况
      const message = response.data.message || errorMessage
      console.error(message)
      reject(new Error(message))
    }
  })
}

/**
 * 处理API请求的加载状态
 * @param {Function} requestFn - API请求函数
 * @param {Function} setLoading - 设置加载状态的函数
 * @returns {Promise} - 返回请求结果
 */
export const handleLoading = async (requestFn, setLoading) => {
  try {
    setLoading(true)
    const result = await requestFn()
    return result
  } finally {
    setLoading(false)
  }
}

/**
 * 构建查询参数
 * @param {Object} params - 查询参数对象
 * @returns {String} - 格式化后的查询字符串
 */
export const buildQueryParams = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return ''
  }
  
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value)
    }
  })
  
  const queryString = queryParams.toString()
  return queryString ? `${queryString}` : ''
}

/**
 * 处理分页数据
 * @param {Object} response - 包含分页数据的响应
 * @returns {Object} - 处理后的分页数据
 */
export const handlePaginationData = (response) => {
  if (!response || !response.results) {
    return {
      list: [],
      total: 0,
      currentPage: 1,
      pageSize: 10
    }
  }
  
  return {
    list: response.results || [],
    total: response.total || 0,
    currentPage: response.current_page || 1,
    pageSize: response.page_size || 10
  }
}