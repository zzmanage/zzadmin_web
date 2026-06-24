import service from './request'
import { extractData } from './responseHandler'

/**
 * 统一的API请求包装
 * 用于减少重复的错误处理代码，提供一致的错误日志格式
 * 
 * @param {Object} config - 请求配置对象
 * @param {string} config.method - HTTP方法
 * @param {string} config.url - 请求URL
 * @param {Object} [config.params] - 查询参数
 * @param {Object} [config.data] - 请求体数据
 * @param {string} operationName - 操作名称（用于错误日志）
 * @param {boolean} [returnFullResponse=false] - 是否返回完整响应对象，默认为false（仅返回data字段）
 * @returns {Promise} - 返回请求结果的Promise
 */
export const apiRequest = async (config, operationName, returnFullResponse = false) => {
  try {
    const response = await service(config)
    // 确保处理完整的响应对象，
    if (config.responseType === 'blob' || returnFullResponse) {
      return response
    } else {
      // 使用responseHandler中的extractData函数统一处理响应数据
      // 这确保了所有API响应都遵循相同的数据解析逻辑，包括处理统一的{code, message, data}格式
      return extractData(response)
    }
  } catch (error) {
    // 构建更详细的错误日志信息
    const errorMessage = `[${operationName}] 失败${error.message ? `: ${error.message}` : ''}`
    console.error(errorMessage)
    
    // 在开发环境下，可以输出更详细的错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('请求配置:', config)
      if (error.response) {
        console.error('错误状态码:', error.response.status)
        console.error('错误数据:', error.response.data)
      }
    }
    
    throw error
  }
}

/**
 * 简化的GET请求包装
 * @param {string} url - 请求URL
 * @param {Object} [params] - 查询参数
 * @param {string} operationName - 操作名称
 * @param {boolean} [returnFullResponse=false] - 是否返回完整响应对象
 * @param {Object} [configOptions] - 额外的配置选项
 * @returns {Promise} - 返回请求结果的Promise
 */
export const apiGet = async (url, params = {}, operationName, returnFullResponse = false, configOptions = {}) => {
  return apiRequest({
    method: 'GET',
    url,
    params,
    ...configOptions
  }, operationName, returnFullResponse)
}

/**
 * 简化的POST请求包装
 * @param {string} url - 请求URL
 * @param {Object} [data] - 请求体数据
 * @param {string} operationName - 操作名称
 * @param {boolean} [returnFullResponse=false] - 是否返回完整响应对象
 * @returns {Promise} - 返回请求结果的Promise
 */
export const apiPost = async (url, data = {}, operationName, returnFullResponse = false) => {
  return apiRequest({
    method: 'POST',
    url,
    data
  }, operationName, returnFullResponse)
}

/**
 * 简化的PUT请求包装
 * @param {string} url - 请求URL
 * @param {Object} [data] - 请求体数据
 * @param {string} operationName - 操作名称
 * @param {boolean} [returnFullResponse=false] - 是否返回完整响应对象
 * @returns {Promise} - 返回请求结果的Promise
 */
export const apiPut = async (url, data = {}, operationName, returnFullResponse = false) => {
  return apiRequest({
    method: 'PUT',
    url,
    data
  }, operationName, returnFullResponse)
}

/**
 * 简化的PATCH请求包装
 * @param {string} url - 请求URL
 * @param {Object} [data] - 请求体数据
 * @param {string} operationName - 操作名称
 * @param {boolean} [returnFullResponse=false] - 是否返回完整响应对象
 * @returns {Promise} - 返回请求结果的Promise
 */
export const apiPatch = async (url, data = {}, operationName, returnFullResponse = false) => {
  return apiRequest({
    method: 'PATCH',
    url,
    data
  }, operationName, returnFullResponse)
}

/**
 * 简化的DELETE请求包装
 * @param {string} url - 请求URL
 * @param {Object|string} [data] - 请求体数据（可选），对于批量删除操作很有用
 * @param {string} operationName - 操作名称
 * @param {boolean} [returnFullResponse=false] - 是否返回完整响应对象
 * @returns {Promise} - 返回请求结果的Promise
 */
export const apiDelete = async (url, data, operationName, returnFullResponse = false) => {
  // 处理参数顺序兼容问题
  // 如果第二个参数是字符串（操作名称），则调整参数顺序
  if (typeof data === 'string') {
    returnFullResponse = operationName || false
    operationName = data
    data = undefined
  }
  
  return apiRequest({
    method: 'DELETE',
    url,
    data: data // 允许DELETE请求发送数据
  }, operationName, returnFullResponse)
}

/**
 * 统一错误处理函数
 * 用于在组件中捕获和处理API错误
 * 
 * @param {Error} error - 错误对象
 * @param {string} [defaultMessage] - 默认错误消息
 * @returns {string} - 格式化的错误消息
 */
export const handleApiError = (error, defaultMessage = '操作失败，请稍后重试') => {
  let errorMessage = defaultMessage
  
  // 尝试从错误对象中提取更具体的错误信息
  if (error.response && error.response.data) {
    const errorData = error.response.data
    
    // 优先处理统一响应格式中的message字段
    if (errorData.message) {
      errorMessage = errorData.message
    } else if (errorData.detail) {
      errorMessage = errorData.detail
    } else if (errorData.error) {
      errorMessage = errorData.error
    } else if (typeof errorData === 'string') {
      errorMessage = errorData
    }
  } else if (error.message) {
    errorMessage = error.message
  }
  
  return errorMessage
}

/**
 * 处理文件下载的统一函数
 * 用于处理blob类型的响应并创建下载链接
 * 
 * @param {Object} response - API响应对象
 * @param {string} defaultFilename - 默认文件 * @param {string} fileType - 文件MIME类型
 * @returns {Object} - {success: boolean, filename: string}
 */
export const handleFileDownload = (response, defaultFilename, fileType) => {
  // 从响应头中获取文件名
  const contentDisposition = response.headers['content-disposition']
  let filename = defaultFilename
  if (contentDisposition) {
    const match = contentDisposition.match(/filename=([^;]+)/i)
    if (match && match[1]) {
      filename = decodeURIComponent(match[1].replace(/"/g, ''))
    }
  }
  
  // 创建下载链接
  const blob = new Blob([response.data], { type: fileType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  
  return { success: true, filename }
}

/**
 * 处理文件导入的统一函数
 * 用于处理文件上传和其他参 * 
 * @param {File} file - 要导入的文件
 * @param {Object} params - 其他参数
 * @returns {FormData} - 格式化后的FormData对象
 */
export const prepareImportData = (file, params = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  
  // 添加其他参数
  Object.keys(params).forEach(key => {
    formData.append(key, params[key])
  })
  
  return formData
}
