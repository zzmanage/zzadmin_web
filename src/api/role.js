import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取所有权限
export const getAllPermissions = async () => {
  return apiGet('/api/permissions/', {}, '获取所有权限')
}

// 获取所有角色（全量数据，不分页）
export const getAllRoles = async () => {
  return apiGet('/api/roles/all_list/', {}, '获取所有角色')
}

// 获取角色列表
export const getRoleList = async (params = {}) => {
  const response = await apiGet('/api/roles/', params, '获取角色列表')
  return response
}

// 获取角色详情
export const getRoleDetail = async (id) => {
  const response = await apiGet(`/api/roles/${id}/`, {}, '获取角色详情')
  return response
}

// 创建角色
export const createRole = async (data) => {
  const response = await apiPost('/api/roles/', data, '创建角色')
  return response
}

// 更新角色
export const updateRole = async (id, data) => {
  const response = await apiPut(`/api/roles/${id}/`, data, '更新角色')
  return response
}

// 删除角色
export const deleteRole = async (id) => {
  const response = await apiDelete(`/api/roles/${id}/`, '删除角色')
  return response
}

// 获取角色权限
export const getRolePermissions = async (id, params = {}) => {
  return apiGet(`/api/roles/${id}/permissions/`, params, '获取角色权限')
}

// 分配角色权限
export const assignRolePermissions = async (roleId, permissionIds) => {
  return apiPost(`/api/roles/${roleId}/permissions/`, 
    { permission_ids: permissionIds }, 
    '分配角色权限'
  )
}

// 更新角色权限（适配新的权限管理页面）
export const updateRolePermissions = async (params) => {
  // 合并菜单ID和按钮ID作为权限ID列表
  const permissionIds = [...params.menu_ids, ...params.button_ids]
  return assignRolePermissions(params.role_id, permissionIds)
}

// 获取角色的菜单权限树
export const getRolePermissionsTree = async (roleId, params = {}) => {
  const response = await apiGet(
    `/api/roles/${roleId}/permissions_tree/`, 
    params, 
    '获取角色权限树',
  )
  
  // 直接返回响应数据，extractData已处理统一格式
  return response
}

// 新的角色权限更新接口，支持同时分配菜单和按钮权限
export const newUpdateRolePermissions = async (roleId, menuIds, buttonIds) => {
  return apiPost(`/api/roles/${roleId}/update_permissions/`, {
    menu_ids: menuIds,
    button_ids: buttonIds
  }, '更新角色权限')
}