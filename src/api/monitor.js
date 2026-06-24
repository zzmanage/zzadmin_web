/**
 * 系统监控API服务
 * 提供各类系统监控数据获取接口
 */
import { apiGet, apiPost } from '../utils/api/apiRequestWrapper'

export default {
  /**
   * 获取在线用户信息
   * @returns {Promise}
   */
  async getOnlineUsers() {
    const response = await apiGet('/api/system/online_users/', {}, '获取在线用户信息')
    return response
  },

  /**
   * 踢出指定用户
   * @param {string} userId - 用户ID
   * @returns {Promise}
   */
  async kickOutUser(userId) {
    const response = await apiPost(`/api/system/kick_out_user/${userId}/`, {}, '踢出指定用户')
    return response
  },

  /**
   * 获取系统监控概览数据
   * @returns {Promise}
   */
  async getSystemOverview() {
    const response = await apiGet('/api/system/overview/', {}, '获取系统监控概览数据')
    return response
  },

  /**
   * 获取系统详细指标数据
   * @returns {Promise}
   */
  async getSystemMetrics() {
    const response = await apiGet('/api/system/metrics/', {}, '获取系统详细指标数据')
    return response
  },

  /**
   * 获取Redis状态数据
   * @returns {Promise}
   */
  async getRedisStatus() {
    const response = await apiGet('/api/redis/status/', {}, '获取Redis状态数据')
    return response
  },

  /**
   * 获取Redis性能指标数据
   * @returns {Promise}
   */
  async getRedisPerformance() {
    const response = await apiGet('/api/redis/performance/', {}, '获取Redis性能指标数据')
    return response
  },

  /**
   * 获取数据库状态数据
   * @returns {Promise}
   */
  async getDatabaseStatus() {
    const response = await apiGet('/api/database/status/', {}, '获取数据库状态数据')
    return response
  },

  /**
   * 获取数据库性能指标数据
   * @returns {Promise}
   */
  async getDatabasePerformance() {
    const response = await apiGet('/api/database/performance/', {}, '获取数据库性能指标数据')
    return response
  },

  /**
   * 获取数据库表信息
   * @returns {Promise}
   */
  async getDatabaseTables() {
    const response = await apiGet('/api/database/tables/', {}, '获取数据库表信息')
    return response
  },

  /**
   * 获取数据库索引使用情况
   * @returns {Promise}
   */
  async getDatabaseIndexUsage() {
    const response = await apiGet('/api/database/index_usage/', {}, '获取数据库索引使用情况')
    return response
  },

  /**
   * 获取数据库慢查询日志
   * @returns {Promise}
   */
  async getDatabaseSlowQueries() {
    const response = await apiGet('/api/database/slow_queries/', {}, '获取数据库慢查询日志')
    return response
  },

  /**
   * 获取服务状态数据
   * @returns {Promise}
   */
  async getServiceStatus() {
    const response = await apiGet('/api/service/status/', {}, '获取服务状态数据')
    return response
  },

  /**
   * 获取运行中的进程信息
   * @returns {Promise}
   */
  async getRunningProcesses() {
    const response = await apiGet('/api/service/processes/', {}, '获取运行中的进程信息')
    return response
  }
}