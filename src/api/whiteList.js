import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取白名单列表
export const getWhiteLists = (params = {}) => {
  return apiGet('/api/api_whitelists/', params, '获取白名单列表')
}

// 获取单个白名单
export const getWhiteList = (id) => {
  return apiGet(`/api/api_whitelists/${id}/`, {}, '获取白名单详情')
}

// 创建白名单
export const createWhiteList = (data) => {
  return apiPost('/api/api_whitelists/', data, '创建白名单')
}

// 更新白名单
export const updateWhiteList = (id, data) => {
  return apiPut(`/api/api_whitelists/${id}/`, data, '更新白名单')
}

// 删除白名单
export const deleteWhiteList = (id) => {
  return apiDelete(`/api/api_whitelists/${id}/`, '删除白名单')
}

// 刷新白名单缓存
export const refreshWhiteListCache = () => {
  return apiPost('/api/api_whitelists/refresh_cache/', {}, '刷新白名单缓存')
}