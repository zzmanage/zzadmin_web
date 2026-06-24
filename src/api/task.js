import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../utils/api/apiRequestWrapper'

/**
 * 获取周期性任务列 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getTasks(params = {}) {
  return apiGet('/api/periodic_tasks/', params, '获取周期性任务列表')
}

/**
 * 添加周期性任 * @param {Object} data 任务数据
 * @returns {Promise}
 */
export function addTask(data) {
  return apiPost('/api/periodic_tasks/', data, '添加周期性任务')
}

/**
 * 更新周期性任 * @param {string} id 任务ID
 * @param {Object} data 任务数据
 * @returns {Promise}
 */
export function updateTask(id, data) {
  return apiPut(`/api/periodic_tasks/${id}/`, data, '更新周期性任务')
}

/**
 * 删除周期性任 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function deleteTask(id) {
  return apiDelete(`/api/periodic_tasks/${id}/`, '删除周期性任务')
}

/**
 * 启用周期性任 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function enableTask(id) {
  return apiPatch(`/api/periodic_tasks/${id}/`, { enabled: true }, '启用周期性任务')
}

/**
 * 禁用周期性任务（PATCH方式 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function disableTask(id) {
  return apiPatch(`/api/periodic_tasks/${id}/`, { enabled: false }, '禁用周期性任务')
}

/**
 * 禁用周期性任务（POST方式 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function disableTaskById(id) {
  return apiPost(`/api/periodic_tasks/${id}/disable/`, {}, '禁用周期性任务')
}

/**
 * 启用周期性任务（POST方式 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function enableTaskById(id) {
  return apiPost(`/api/periodic_tasks/${id}/enable/`, {}, '启用周期性任务')
}

/**
 * 执行周期性任务
 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function executeTaskById(id) {
  return apiPost(`/api/periodic_tasks/${id}/execute/`, {}, '执行周期性任务')
}

/**
 * 执行周期性任务
 * @param {string} id 任务ID
 * @returns {Promise}
 */
export function executeTask(id) {
  return apiPost(`/api/periodic_tasks/${id}/execute/`, {}, '执行周期性任务')
}

/**
 * 获取任务日志
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getTaskLogs(params = {}) {
  return apiGet('/api/task_logs/', params, '获取任务日志')
}

/**
 * 获取可用任务列表
 * @returns {Promise}
 */
export function getAvailableTasks() {
  return apiGet('/api/task_management/available_tasks/', {}, '获取可用任务列表')
}

/**
 * 获取任务参数配置信息
 * @param {string} taskName 任务名称
 * @returns {Promise}
 */
export function getTaskParameters(taskName) {
  return apiGet('/api/task_management/task_parameters/', { task_name: taskName }, '获取任务参数配置信息')
}

/**
 * 获取间隔调度列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getIntervalSchedules(params = {}) {
  return apiGet('/api/interval_schedules/', params, '获取间隔调度列表')
}

/**
 * 创建间隔调度
 * @param {Object} data 间隔调度数据
 * @returns {Promise}
 */
export function createIntervalSchedule(data) {
  return apiPost('/api/interval_schedules/', data, '创建间隔调度')
}

/**
 * 更新间隔调度
 * @param {string} id 间隔调度ID
 * @param {Object} data 间隔调度数据
 * @returns {Promise}
 */
export function updateIntervalSchedule(id, data) {
  return apiPut(`/api/interval_schedules/${id}/`, data, '更新间隔调度')
}

/**
 * 删除间隔调度
 * @param {string} id 间隔调度ID
 * @returns {Promise}
 */
export function deleteIntervalSchedule(id) {
  return apiDelete(`/api/interval_schedules/${id}/`, '删除间隔调度')
}

/**
 * 获取定时调度列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getCrontabSchedules(params = {}) {
  return apiGet('/api/crontab_schedules/', params, '获取定时调度列表')
}

/**
 * 创建定时调度
 * @param {Object} data 定时调度数据
 * @returns {Promise}
 */
export function createCrontabSchedule(data) {
  return apiPost('/api/crontab_schedules/', data, '创建定时调度')
}

/**
 * 更新定时调度
 * @param {string} id 定时调度ID
 * @param {Object} data 定时调度数据
 * @returns {Promise}
 */
export function updateCrontabSchedule(id, data) {
  return apiPut(`/api/crontab_schedules/${id}/`, data, '更新定时调度')
}

/**
 * 删除定时调度
 * @param {string} id 定时调度ID
 * @returns {Promise}
 */
export function deleteCrontabSchedule(id) {
  return apiDelete(`/api/crontab_schedules/${id}/`, '删除定时调度')
}

/**
 * 撤销正在执行的任 * @param {string} taskId 任务ID
 * @returns {Promise}
 */
export function revokeTask(taskId) {
  return apiPost('/api/task_management/revoke_task/', { task_id: taskId }, '撤销任务')
}