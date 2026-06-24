import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../utils/api/apiRequestWrapper'

/**
 * 按钮管理API
 */

/**
 * 获取按钮列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getButtonList = async (params = {}) => {
  // 设置returnFullResponse为true，返回完整的响应对象
  // 这样crud-helper.js中的fetchData方法才能正确处理分页数据
  const response = await apiGet('/api/buttons/', params, '获取按钮列表')
  return response
}

/**
 * 获取单个按钮详情
 * @param {string} id - 按钮ID
 * @returns {Promise}
 */
export const getButtonDetail = async (id) => {
  const response = await apiGet(`/api/buttons/${id}/`, {}, '获取按钮详情')
  return response
}

/**
 * 创建新按 * @param {Object} data - 按钮数据
 * @returns {Promise}
 */
export const createButton = async (data) => {
  const response = await apiPost('/api/buttons/', data, '创建按钮')
  return response
}

/**
 * 更新按钮
 * @param {string} id - 按钮ID
 * @param {Object} data - 按钮数据
 * @returns {Promise}
 */
export const updateButton = async (id, data) => {
  const response = await apiPut(`/api/buttons/${id}/`, data, '更新按钮')
  return response
}

/**
 * 部分更新按钮
 * @param {string} id - 按钮ID
 * @param {Object} data - 按钮数据
 * @returns {Promise}
 */
export const patchButton = async (id, data) => {
  const response = await apiPatch(`/api/buttons/${id}/`, data, '部分更新按钮')
  return response
}

/**
 * 删除按钮
 * @param {string} id - 按钮ID
 * @returns {Promise}
 */
export const deleteButton = async (id) => {
  const response = await apiDelete(`/api/buttons/${id}/`, '删除按钮')
  return response
}

/**
 * 批量删除按钮
 * @param {Array} ids - 按钮ID数组
 * @returns {Promise}
 */
export const batchDeleteButtons = async (ids) => {
  const response = await apiDelete('/api/buttons/', { ids }, '批量删除按钮')
  return response
}

/**
 * 获取全量按钮列表（非分页 * @returns {Promise}
 */
export const getAllButtons = async () => {
  const response = await apiGet('/api/buttons/all/', {}, '获取全量按钮列表')
  return response
}

/**
 * 刷新按钮缓存
 * @returns {Promise}
 */
export const refreshButtonCache = async () => {
  const response = await apiPost('/api/buttons/refresh_cache/', {}, '刷新按钮缓存')
  return response
}

export default {
  getButtonList,
  getButtonDetail,
  createButton,
  updateButton,
  patchButton,
  deleteButton,
  batchDeleteButtons,
  getAllButtons,
  refreshButtonCache
}