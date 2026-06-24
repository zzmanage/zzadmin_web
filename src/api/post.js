import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api/apiRequestWrapper'

// 获取岗位列表
export const getPostList = async (params = {}) => {
  return await apiGet('/api/posts/', params, '获取岗位列表')
}

// 获取岗位详情
export const getPostDetail = async (id) => {
  return await apiGet(`/api/posts/${id}/`, {}, '获取岗位详情')
}

// 创建岗位
export const createPost = async (data) => {
  return await apiPost('/api/posts/', data, '创建岗位')
}

// 更新岗位
export const updatePost = async (id, data) => {
  return await apiPut(`/api/posts/${id}/`, data, '更新岗位')
}

// 删除岗位
export const deletePost = async (id) => {
  return await apiDelete(`/api/posts/${id}/`, '删除岗位')
}

// 批量删除岗位
export const batchDeletePosts = async (ids) => {
  return await apiDelete('/api/posts/batch_delete/', ids, '批量删除岗位')
}

// 获取所有岗位（全量数据，不分页）
export const getAllPosts = async () => {
  return await apiGet('/api/posts/all_list/', {}, '获取所有岗位')
}