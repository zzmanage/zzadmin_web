import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api/apiRequestWrapper'

/**
 * 租户管理API
 */

// 获取租户列表
export function getTenantList(params = {}) {
  return apiGet('/api/tenants/', params, '获取租户列表')
}

// 获取租户详情
export function getTenantDetail(id) {
  return apiGet(`/api/tenants/${id}/`, {}, '获取租户详情')
}

// 创建租户
export function createTenant(data) {
  return apiPost('/api/tenants/', data, '创建租户')
}

// 更新租户
export function updateTenant(id, data) {
  return apiPut(`/api/tenants/${id}/`, data, '更新租户')
}

// 删除租户
export function deleteTenant(id) {
  return apiDelete(`/api/tenants/${id}/`, '删除租户')
}

// 获取租户用户列表
export function getTenantUsers(tenantId) {
  return apiGet(`/api/tenants/${tenantId}/users/`, {}, '获取租户用户列表')
}

// 获取租户配置
export function getTenantSettings(tenantId) {
  return apiGet(`/api/tenants/${tenantId}/tenant_settings/`, {}, '获取租户配置')
}

// 更新租户配置
export function updateTenantSettings(tenantId, data) {
  return apiPut(`/api/tenants/${tenantId}/tenant_settings/`, data, '更新租户配置')
}

// 获取租户用户关联列表
export function getTenantUserList(params = {}) {
  return apiGet('/api/tenant_users/', params, '获取租户用户关联列表')
}

// 创建租户用户关联
export function createTenantUser(data) {
  return apiPost('/api/tenant_users/', data, '创建租户用户关联')
}

// 添加用户到租户
export function addTenantUser(tenantId, userId, role = 'user') {
  return apiPost('/api/tenant_users/', {
    tenant_id: tenantId,
    user_id: userId,
    role
  }, '添加用户到租户')
}

// 更新租户用户角色
export function updateTenantUser(tenantId, userId, role) {
  return apiPut(`/api/tenants/${tenantId}/users/${userId}/`, { role }, '更新租户用户角色')
}

// 从租户移除用户
export function removeTenantUser(tenantId, userId) {
  return apiDelete(`/api/tenants/${tenantId}/users/${userId}/`, '从租户移除用户')
}

// 更新租户用户关联（通过ID）
export function updateTenantUserById(id, data) {
  return apiPut(`/api/tenant_users/${id}/`, data, '更新租户用户关联')
}

// 删除租户用户关联（通过ID）
export function deleteTenantUserById(id) {
  return apiDelete(`/api/tenant_users/${id}/`, '删除租户用户关联')
}

// 获取当前用户的租户角色列表
export function getMyTenantRoles() {
  return apiGet('/api/tenant_users/my_roles/', {}, '获取当前用户的租户角色列表')
}
