import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取菜单按钮列表
export const getMenuButtonList = async (params = {}) => {
  return await apiGet('/api/menu_buttons/', params, '获取菜单按钮列表')
}

// 获取菜单按钮详情
export const getMenuButtonDetail = async (id) => {
  return await apiGet(`/api/menu_buttons/${id}/`, {}, '获取菜单按钮详情')
}

// 创建菜单按钮
export const createMenuButton = async (data) => {
  return await apiPost('/api/menu_buttons/', data, '创建菜单按钮')
}

// 更新菜单按钮
export const updateMenuButton = async (id, data) => {
  return await apiPut(`/api/menu_buttons/${id}/`, data, '更新菜单按钮')
}

// 删除菜单按钮
export const deleteMenuButton = async (id) => {
  return await apiDelete(`/api/menu_buttons/${id}/`, '删除菜单按钮')
}