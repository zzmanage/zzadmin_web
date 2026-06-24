import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取权限列表
export const getPermissionList = async (params = {}) => {
  return await apiGet('/api/permissions/', params, '获取权限列表')
}

// 获取权限详情
export const getPermissionDetail = async (id) => {
  return await apiGet(`/api/permissions/${id}/`, {}, '获取权限详情')
}

// 创建权限
export const createPermission = async (data) => {
  return await apiPost('/api/permissions/', data, '创建权限')
}

// 更新权限
export const updatePermission = async (id, data) => {
  return await apiPut(`/api/permissions/${id}/`, data, '更新权限')
}

// 删除权限
export const deletePermission = async (id) => {
  return await apiDelete(`/api/permissions/${id}/`, '删除权限')
}

// 获取权限树
export const getPermissionTree = async () => {
  return await apiGet('/api/permissions/tree/', {}, '获取权限树')
}