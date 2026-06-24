import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取菜单列表
export const getMenuList = async (params = {}) => {
  return await apiGet('/api/menus/', params, '获取菜单列表')
}

// 获取菜单详情
export const getMenuDetail = async (id) => {
  return await apiGet(`/api/menus/${id}/`, {}, '获取菜单详情')
}

// 创建菜单
export const createMenu = async (data) => {
  return await apiPost('/api/menus/', data, '创建菜单')
}

// 更新菜单
export const updateMenu = async (id, data) => {
  return await apiPut(`/api/menus/${id}/`, data, '更新菜单')
}

// 删除菜单
export const deleteMenu = async (id) => {
  return await apiDelete(`/api/menus/${id}/`, '删除菜单')
}

// 获取菜单树
export const getMenuTree = async (params = {}) => {
  return await apiGet('/api/menus/tree/', params, '获取菜单树')
}

// 获取当前用户菜单
export const getUserMenus = async () => {
  return await apiGet('/api/menus/user_menus/', {}, '获取用户菜单')
}
