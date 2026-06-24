import request from './request'

export const getWorkflowDefinitionList = (params = {}) => {
  return request({
    url: '/api/workflows/',
    method: 'get',
    params
  })
}

export const getWorkflowDefinitionById = (id) => {
  return request({
    url: `/api/workflows/${id}/`,
    method: 'get'
  })
}

export const createWorkflowDefinition = (data) => {
  return request({
    url: '/api/workflows/',
    method: 'post',
    data
  })
}

export const updateWorkflowDefinition = (id, data) => {
  return request({
    url: `/api/workflows/${id}/`,
    method: 'put',
    data
  })
}

export const deleteWorkflowDefinition = (id) => {
  return request({
    url: `/api/workflows/${id}/`,
    method: 'delete'
  })
}

export const toggleWorkflowStatus = (id) => {
  return request({
    url: `/api/workflows/${id}/toggle/`,
    method: 'post'
  })
}

export const getActiveWorkflowDefinitions = () => {
  return request({
    url: '/api/workflows/active/',
    method: 'get'
  })
}

export const getWorkflowInstanceList = (params = {}) => {
  return request({
    url: '/api/workflow_instances/',
    method: 'get',
    params
  })
}

export const getWorkflowInstanceById = (id) => {
  return request({
    url: `/api/workflow_instances/${id}/`,
    method: 'get'
  })
}

export const startWorkflowInstance = (data) => {
  return request({
    url: '/api/workflow_instances/start/',
    method: 'post',
    data
  })
}

export const completeWorkflowInstance = (id) => {
  return request({
    url: `/api/workflow_instances/${id}/complete/`,
    method: 'post'
  })
}

export const getRunningWorkflowInstances = () => {
  return request({
    url: '/api/workflow_instances/running/',
    method: 'get'
  })
}

export const getCompletedWorkflowInstances = () => {
  return request({
    url: '/api/workflow_instances/completed/',
    method: 'get'
  })
}

export const getMyWorkflowInstances = () => {
  return request({
    url: '/api/workflow_instances/mine/',
    method: 'get'
  })
}

export const getWorkflowTaskList = (params = {}) => {
  return request({
    url: '/api/workflow_tasks/',
    method: 'get',
    params
  })
}

export const getPendingWorkflowTasks = () => {
  return request({
    url: '/api/workflow_tasks/pending/',
    method: 'get'
  })
}

export const getMyWorkflowTasks = () => {
  return request({
    url: '/api/workflow_tasks/mine/',
    method: 'get'
  })
}

export const getUnassignedWorkflowTasks = () => {
  return request({
    url: '/api/workflow_tasks/unassigned/',
    method: 'get'
  })
}

export const claimWorkflowTask = (taskId) => {
  return request({
    url: `/api/workflow_tasks/${taskId}/claim/`,
    method: 'post'
  })
}

export const completeWorkflowTask = (taskId, data = {}) => {
  return request({
    url: `/api/workflow_tasks/${taskId}/complete/`,
    method: 'post',
    data
  })
}

export const rejectWorkflowTask = (taskId, data = {}) => {
  return request({
    url: `/api/workflow_tasks/${taskId}/reject/`,
    method: 'post',
    data
  })
}

export const getWorkflowTransitionsByTask = (taskId) => {
  return request({
    url: `/api/workflow_transitions/?task_id=${taskId}`,
    method: 'get'
  })
}