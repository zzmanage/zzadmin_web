import { apiGet, apiPost, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取操作日志列表
export const getOperationLogList = async (params = {}) => {
  return await apiGet('/api/operation_logs/', params, '获取操作日志列表')
}

// 获取操作日志详情
export const getOperationLogDetail = async (id) => {
  return await apiGet(`/api/operation_logs/${id}/`, {}, '获取操作日志详情')
}

// 删除操作日志
export const deleteOperationLog = async (id) => {
  return await apiDelete(`/api/operation_logs/${id}/`, '删除操作日志')
}

// 批量删除操作日志
export const batchDeleteOperationLogs = async (ids) => {
  return await apiDelete('/api/operation_logs/batch_delete/', { ids }, '批量删除操作日志')
}

// 清空操作日志
export const clearOperationLogs = async () => {
  return await apiPost('/api/operation_logs/clear/', {}, '清空操作日志')
}