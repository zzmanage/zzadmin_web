import { apiGet, apiPost, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取登录日志列表
export const getLoginLogList = async (params = {}) => {
  return await apiGet('/api/login_logs/', params, '获取登录日志列表')
}

// 获取登录日志详情
export const getLoginLogDetail = async (id) => {
  return await apiGet(`/api/login_logs/${id}/`, {}, '获取登录日志详情')
}

// 删除登录日志
export const deleteLoginLog = async (id) => {
  return await apiDelete(`/api/login_logs/${id}/`, '删除登录日志')
}

// 批量删除登录日志
export const batchDeleteLoginLogs = async (ids) => {
  return await apiDelete('/api/login_logs/batch_delete/', ids, '批量删除登录日志')
}

// 清空登录日志
export const clearLoginLogs = async () => {
  return await apiPost('/api/login_logs/clear/', {}, '清空登录日志')
}

// 导出登录日志
export const exportLoginLogs = async (params = {}) => {
  return await apiGet('/api/login_logs/export/', params, '导出登录日志', { responseType: 'blob' })
}