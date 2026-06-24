import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取字典列表
export const getDictionaryList = async (params = {}) => {
  return await apiGet('/api/dictionaries/', params, '获取字典列表')
}

// 获取字典详情
export const getDictionaryDetail = async (dictId) => {
  return await apiGet(`/api/dictionaries/${dictId}/`, {}, '获取字典详情')
}

// 创建字典
export const createDictionary = async (data) => {
  return await apiPost('/api/dictionaries/', data, '创建字典')
}

// 更新字典
export const updateDictionary = async (dictId, data) => {
  return await apiPut(`/api/dictionaries/${dictId}/`, data, '更新字典')
}

// 删除字典
export const deleteDictionary = async (dictId) => {
  return await apiDelete(`/api/dictionaries/${dictId}/`, '删除字典')
}

// 获取字典项 - 使用id作为参数
export const getDictionaryItems = async (dictId, params = {}) => {
  // 确保只调用一次接口，避免重复请求
  const response = await apiGet(`/api/dictionaries/${dictId}/items/`, params, '获取字典项')
  // 确保返回的数据结构包含results字段，以匹配前端使用方式
  return response.data ? response.data : response
}

// 添加字典项 - 使用统一的创建接口，通过parent_id指定父节点
export const addDictionaryItem = async (dictId, data) => {
  // 确保data是对象
  const itemData = { ...data }
  // 不再重复设置parent_id，因为前端已经在formData中设置了
  // 调用标准的创建字典接口
  return await apiPost('/api/dictionaries/', itemData, '添加字典项')
}

// 更新字典项 - 使用统一的更新接口
export const updateDictionaryItem = async (dictId, itemId, data) => {
  // 直接调用标准的更新字典接口，使用itemId作为资源ID
  return await apiPut(`/api/dictionaries/${itemId}/`, data, '更新字典项')
}

// 删除字典项 - 使用统一的删除接口
export const deleteDictionaryItem = async (dictId, itemId) => {
  // 直接调用标准的删除字典接口，使用itemId作为资源ID
  return await apiDelete(`/api/dictionaries/${itemId}/`, '删除字典项')
}

// 刷新字典缓存
export const refreshDictionaryCache = async () => {
  return await apiPost('/api/dictionaries/refresh_cache/', {}, '刷新字典缓存')
}