import { apiGet, apiPost, apiDelete, apiPatch } from '../utils/api/apiRequestWrapper'

/**
 * 上传文件
 * @param {File} file - 要上传的文件对象
 * @param {Object} options - 上传选项
 * @param {Function} options.onUploadProgress - 上传进度回调函数
 * @param {string} options.description - 文件描述
 * @param {boolean} options.is_public - 是否公开
 * @returns {Promise} 返回上传结果的Promise
 */
export const uploadFile = async (file, options = {}) => {
  const formData = new FormData()
  // 直接使用数据库模型中的实际字段名
  formData.append('file', file)
  formData.append('name', file.name)
  formData.append('size', file.size)
  
  // 如果有额外的参数，可以添加到formData
  if (options.fileType) {
    formData.append('file_type', options.fileType)
  } else {
    // 自动提取文件类型
    const fileType = file.name.split('.').pop().toLowerCase()
    formData.append('file_type', fileType)
  }
  
  if (options.description) {
    formData.append('description', options.description)
  }

  // 添加权限参数（匹配数据库模型中的permission字段）
  // 0:私有, 1:部门可见, 2:公开
  const permission = options.is_public ? 2 : 0
  formData.append('permission', permission)
  
  // 添加文件分类（匹配数据库模型中的category字段，使用数字编码）
  const fileExt = file.name.split('.').pop().toLowerCase()
  let category = 5 // 默认为其他
  if (['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt)) {
    category = 0 // 文档
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExt)) {
    category = 1 // 图片
  } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExt)) {
    category = 2 // 视频
  } else if (['mp3', 'wav', 'flac'].includes(fileExt)) {
    category = 3 // 音频
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) {
    category = 4 // 压缩
  }
  formData.append('category', category)

  return await apiPost('/api/files/upload/', formData, '上传文件', {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: options.onUploadProgress
  })
}

/**
 * 获取文件列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} params.file_type - 文件类型
 * @param {string} params.name - 文件名搜 * @param {string} params.category - 文件分类
 * @param {string} params.uploader_id - 上传者ID
 * @returns {Promise} 返回文件列表的Promise
 */
export const getFileList = async (params = {}) => {
  const response = await apiGet('/api/files/', params, '获取文件列表')
  return response
}

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise} 返回删除结果的Promise
 */
export const deleteFile = async (fileId) => {
  return await apiDelete(`/api/files/${fileId}/`, '删除文件')
}

/**
 * 下载文件
 * @param {string} fileId - 文件ID
 * @returns {Promise} 返回下载文件的Promise
 */
export const downloadFile = async (fileId) => {
    
  // 使用returnFullResponse=true确保获取完整响应对象
  const response = await apiGet(`/api/files/${fileId}/download/`, {}, '下载文件', true, { responseType: 'blob' })
  
    
  // 尝试多种方式获取响应
  // 创建下载链接 - 使用response.data作为blob对象
  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  
  // 从响应头获取文件名
  let fileName = 'download_file'
  
  // 尝试多种方式获取content-disposition
  let contentDisposition = response.headers.get('content-disposition') || 
                           response.headers.get('Content-Disposition') || 
                           response.headers['content-disposition'] || 
                           response.headers['Content-Disposition']
  
    
  if (contentDisposition) {
    // 尝试多种正则表达式匹配
    let match = contentDisposition.match(/filename="([^;"\r\n]+)"/i) || 
                contentDisposition.match(/filename=([^;]+)/i)
    
    if (match && match[1]) {
      // 去除可能的引号并解码URL编码的文件名
      fileName = match[1].replace(/"/g, '').trim()
            
      // 解码URL编码的文件名
      try {
        fileName = decodeURIComponent(fileName)
      } catch (e) {
        // 如果解码失败，保留原始文件名
        console.warn('文件名解码失败', e)
      }
    } else {
      console.warn('未从content-disposition中匹配到文件名')
    }
  } else {
    console.warn('未获取到content-disposition响应头')
    // 作为后备方案，从fileId获取文件详情来获取文件名
    try {
      const fileDetail = await getFileDetail(fileId)
      if (fileDetail && fileDetail.name) {
        fileName = fileDetail.name
              }
    } catch (e) {
      console.warn('获取文件详情失败:', e)
    }
  }
  
    
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  
  return { success: true, fileName }
}

/**
 * 获取文件详情
 * @param {string} fileId - 文件ID
 * @returns {Promise} 返回文件详情的Promise
 */
export const getFileDetail = async (fileId) => {
  return await apiGet(`/api/files/${fileId}/`, {}, '获取文件详情')
}

/**
 * 更新文件信息
 * @param {string} fileId - 文件ID
 * @param {Object} data - 要更新的文件数据
 * @param {string} data.name - 文件名称
 * @param {string} data.description - 文件描述
 * @param {number} data.permission - 文件权限:私有, 1:部门可见, 2:公开 * @returns {Promise} 返回更新结果的Promise
 */
export const updateFileInfo = async (fileId, data) => {
  return await apiPatch(`/api/files/${fileId}/`, data, '更新文件信息')
}

/**
 * 更新文件可见性
 * @param {string} fileId - 文件ID
 * @param {number} permission - 文件权限: 0-私有, 1-部门可见, 2-公开
 * @returns {Promise} 返回更新结果的Promise
 */
export const updateFileVisibility = async (fileId, permission) => {
  return await apiPatch(`/api/files/${fileId}/`, { permission }, '更新文件可见性')
}