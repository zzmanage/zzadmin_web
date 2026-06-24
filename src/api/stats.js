/**
 * 统计API服务
 * 提供各类统计数据获取接口
 */
import { apiGet } from '../utils/api/apiRequestWrapper'

export default {
  // ============ 仪表盘相关API - 修复后的正确后端接口路径 ============
  /**
   * 获取系统概览统计数据
   * @returns {Promise}
   */
  async getSystemOverview() {
    const response = await apiGet('/api/statistics/overview/', {}, '获取系统概览统计数据')
    return response
  },

  /**
   * 获取用户统计数据（用户增长趋势）
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async getUserStatistics(params = {}) {
    const response = await apiGet('/api/statistics/user/', params, '获取用户统计数据')
    return response
  },

  /**
   * 获取用户统计详情（部门用户分布、角色用户分布）
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async getUserStats(params = {}) {
    const response = await apiGet('/api/statistics/user_stats/', params, '获取用户统计详情')
    return response
  },

  /**
   * 获取操作日志统计数据
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async getOperationLogStatistics(params = {}) {
    const response = await apiGet('/api/statistics/operation-log/', params, '获取操作日志统计数据')
    return response
  },

  /**
   * 获取登录日志统计数据
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async getLoginLogStatistics(params = {}) {
    const response = await apiGet('/api/statistics/login-log/', params, '获取登录日志统计数据')
    return response
  },

  /**
   * 获取任务统计数据
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async getTaskStatistics(params = {}) {
    const response = await apiGet('/api/statistics/task/', params, '获取任务统计数据')
    return response
  },

  /**
   * 获取文件统计数据
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async getFileStatistics(params = {}) {
    const response = await apiGet('/api/statistics/file/', params, '获取文件统计数据')
    return response
  },

  /**
   * 获取仪表盘数据
   * @returns {Promise}
   */
  async getDashboardData() {
    const response = await apiGet('/api/statistics/dashboard/', {}, '获取仪表盘数据')
    return response
  },

  /**
   * 获取系统性能指标
   * @returns {Promise}
   */
  async getSystemMetrics() {
    const response = await apiGet('/api/statistics/system-metrics/', {}, '获取系统性能指标')
    return response
  },

  /**
   * 获取API性能统计
   * @returns {Promise}
   */
  async getApiPerformance() {
    const response = await apiGet('/api/statistics/api-performance/', {}, '获取API性能统计')
    return response
  },

  /**
   * 获取系统错误统计
   * @returns {Promise}
   */
  async getErrorStatistics() {
    const response = await apiGet('/api/statistics/error-statistics/', {}, '获取系统错误统计')
    return response
  },

  /**
   * 获取Redis监控数据
   * @returns {Promise}
   */
  async getRedisMonitorData() {
    const response = await apiGet('/api/statistics/redis-monitor/', {}, '获取Redis监控数据')
    return response
  },

  /**
   * 获取数据库监控数据
   * @returns {Promise}
   */
  async getDatabaseMonitorData() {
    const response = await apiGet('/api/statistics/database-monitor/', {}, '获取数据库监控数据')
    return response
  },

  /**
   * 导出统计报表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  async exportStatistics(params = {}) {
    const response = await apiGet('/api/statistics/export-statistics/', params, '导出统计报表', false, { responseType: 'blob' })
    return response
  }
}