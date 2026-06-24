import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取部门列表
export const getDeptList = async (params = {}) => {
  // apiGet已经返回处理后的数据，不需要再访问.data属性
  return await apiGet('/api/departments/', params, '获取部门列表')
}

// 获取部门树结构
export const getDeptTree = async () => {
  const response = await apiGet('/api/departments/tree/', {}, '获取部门树结构')
  return response
}

// 获取部门详情
export const getDeptDetail = async (id) => {
  return await apiGet(`/api/departments/${id}/`, {}, '获取部门详情')
}

// 创建部门
export const createDept = async (data) => {
  return await apiPost('/api/departments/', data, '创建部门')
}

// 更新部门
export const updateDept = async (id, data) => {
  return await apiPut(`/api/departments/${id}/`, data, '更新部门')
}

// 删除部门
export const deleteDept = async (id) => {
  return await apiDelete(`/api/departments/${id}/`, '删除部门')
}

// 导出部门列表为Excel
export const exportDeptsToExcel = async (params = {}) => {
  try {
    const response = await apiGet('/api/departments/export-excel/', params, '导出部门列表为Excel', { responseType: 'blob' })
    
    // 从响应头中获取文件名
    const contentDisposition = response.headers['content-disposition']
    let filename = '部门列表.xlsx'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=([^;]+)/i)
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/"/g, ''))
      }
    }
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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
  } catch (error) {
    console.error('导出Excel失败:', error)
    throw error
  }
}

// 导出部门列表为CSV
export const exportDeptsToCsv = async (params = {}) => {
  try {
    const response = await apiGet('/api/departments/export-csv/', params, '导出部门列表为CSV', { responseType: 'blob' })
    
    // 从响应头中获取文件名
    const contentDisposition = response.headers['content-disposition']
    let filename = '部门列表.csv'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=([^;]+)/i)
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/"/g, ''))
      }
    }
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'text/csv; charset=utf-8' })
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
  } catch (error) {
    console.error('导出CSV失败:', error)
    throw error
  }
}

// 导入部门列表（Excel格式）
export const importDeptsFromExcel = async (file, params = {}) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // 添加其他参数
    Object.keys(params).forEach(key => {
      formData.append(key, params[key])
    })
    
    const response = await apiPost('/api/departments/import-excel/', formData, '导入部门列表（Excel格式）', {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('导入Excel失败:', error)
    throw error
  }
}

// 导入部门列表（CSV格式）
export const importDeptsFromCsv = async (file, params = {}) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // 添加其他参数
    Object.keys(params).forEach(key => {
      formData.append(key, params[key])
    })
    
    const response = await apiPost('/api/departments/import-csv/', formData, '导入部门列表（CSV格式）', {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('导入CSV失败:', error)
    throw error
  }
}