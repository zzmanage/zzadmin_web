import { apiGet, apiPost, apiPut, apiPatch, apiDelete, handleFileDownload, prepareImportData } from '../utils/api/apiRequestWrapper'

// 获取用户信息（兼容旧API调用）
export const getUserInfo = async () => {
  return apiGet('/api/users/me/', {}, '获取用户信息')
}

// 重置用户密码
export const resetUserPassword = async (data) => {
  return apiPost('/api/auth/reset_password/', data, '重置用户密码')
}

// 获取用户列表
export const getUserList = async (params = {}) => {
  return apiGet('/api/users/', params, '获取用户列表')
}

// 获取用户详情
export const getUserDetail = async (id) => {
  return apiGet(`/api/users/${id}/`, {}, '获取用户详情')
}

// 创建用户
export const createUser = async (data) => {
  return apiPost('/api/users/', data, '创建用户')
}

// 更新用户
export const updateUser = async (id, data) => {
  return apiPatch(`/api/users/${id}/`, data, '更新用户')
}

// 删除用户
export const deleteUser = async (id) => {
  return apiDelete(`/api/users/${id}/`, '删除用户')
}

// 批量删除用户
export const batchDeleteUsers = async (ids) => {
  return apiDelete('/api/users/', ids, '批量删除用户')
}

// 获取用户角色
export const getUserRoles = async (userId) => {
  return apiGet(`/api/users/${userId}/roles/`, {}, '获取用户角色')
}

// 更新用户角色
export const updateUserRoles = async (userId, data) => {
  return apiPut(`/api/users/${userId}/roles/`, data, '更新用户角色')
}

// 修改用户密码
export const changePassword = async (id, data) => {
  return apiPut(`/api/users/${id}/change_password/`, data, '修改用户密码')
}

// 重置用户密码
export const resetPassword = async (id) => {
  return apiPut(`/api/users/${id}/reset_password/`, {}, '重置用户密码')
}

// 获取当前登录用户信息
export const getCurrentUser = async () => {
  return apiGet('/api/users/current/', {}, '获取当前用户信息')
}

// 导出用户列表为Excel
export const exportUsersToExcel = async (params = {}) => {
  const response = await apiGet('/api/users/export-excel/', params, '导出用户列表为Excel', { responseType: 'blob' })
  return handleFileDownload(
    response,
    '用户列表.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
}

// 导出用户列表为CSV
export const exportUsersToCsv = async (params = {}) => {
  const response = await apiGet('/api/users/export-csv/', params, '导出用户列表为CSV', { responseType: 'blob' })
  return handleFileDownload(
    response,
    '用户列表.csv',
    'text/csv; charset=utf-8'
  )
}

// 导入用户列表（Excel格式）
export const importUsersFromExcel = async (file, params = {}) => {
  const formData = prepareImportData(file, params)
  return apiPost('/api/users/import-excel/', formData, '导入用户列表（Excel格式）', {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导入用户列表（CSV格式）
export const importUsersFromCsv = async (file, params = {}) => {
  const formData = prepareImportData(file, params)
  return apiPost('/api/users/import-csv/', formData, '导入用户列表（CSV格式）', {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
