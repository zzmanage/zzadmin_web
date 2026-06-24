import { apiGet } from '../utils/api/apiRequestWrapper'

/**
 * 获取所有可用的API端点列表
 * @returns {Promise}
 */
export const getAllApiEndpoints = () => {
  return apiGet('/api/api_endpoints/', {}, '获取所有可用的API端点列表')
}