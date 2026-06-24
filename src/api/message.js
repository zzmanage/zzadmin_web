import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../utils/api/apiRequestWrapper'

// 消息服务对象
export const messageService = {
  // 获取消息列表 - 统一接口
  getMessages: async (params = {}) => {
    return await apiGet('/api/messages/', params, '获取消息列表')
  },

  // 获取接收的消息列表 - 获取UserMessage数据
  getReceivedMessages: async (params = {}) => {
    return await apiGet('/api/user_messages/', params, '获取接收的消息列表')
  },

  // 获取单个消息
  getMessage: async (id) => {
    return await apiGet(`/api/messages/${id}/`, {}, '获取消息详情')
  },

  // 创建消息 - 统一接口
  createMessage: async (data) => {
    return await apiPost('/api/messages/', data, '创建消息')
  },

  // 更新消息 - 操作Message
  updateMessage: async (id, data) => {
    return await apiPut(`/api/messages/${id}/`, data, '更新消息')
  },

  // 标记消息为已读 - 更新UserMessage状态
  markAsRead: async (id) => {
    return await apiPost(`/api/user_messages/${id}/mark_read/`, {}, '标记消息已读')
  },

  // 标记消息为已处理 - 更新UserMessage状态
  markAsProcessed: async (id) => {
    return await apiPost(`/api/user_messages/${id}/mark_processed/`, {}, '标记消息已处理')
  },

  // 删除消息 - 操作Message
  deleteMessage: async (id) => {
    return await apiDelete(`/api/messages/${id}/`, '删除消息')
  },

  // 获取未读消息数量 - 获取user_message表中当前用户的未读消息数
  getUnreadCount: async () => {
    try {
      return await apiGet('/api/user_messages/unread_count/', {}, '获取未读消息数量')
    } catch {
      // 错误时返回默认值，避免页面显示异常
      return { count: 0 }
    }
  },

  // 获取最近的通知 - 获取user_message表中当前用户的最近消息
  getRecentNotifications: async (limit = 10) => {
    try {
      return await apiGet('/api/user_messages/', { limit: limit, ordering: '-created_at' }, '获取最近通知')
    } catch {
      // 错误时返回空数组，防止页面显示错误
      return { results: [] }
    }
  },

  // 标记所有消息为已读 - 操作user_message
  markAllAsRead: async () => {
    return await apiPost('/api/user_messages/mark_all_as_read/', {}, '标记所有消息为已读')
  },

  // 标记所有消息为已处理 - 操作user_message
  markAllAsProcessed: async () => {
    return await apiPost('/api/user_messages/mark_all_processed/', {}, '标记所有消息为已处理')
  },

  // 获取消息接收设置
  getMessageSettings: async () => {
    return await apiGet('/api/message_settings/', {}, '获取消息接收设置')
  },

  // 更新消息接收设置
  updateMessageSettings: async (data) => {
    return await apiPut('/api/message_settings/1/', data, '更新消息接收设置')
  }
}


// 导出单个的函数供其他地方使用
export const getMessages = messageService.getMessages
export const getMessage = messageService.getMessage
export const createMessage = messageService.createMessage
export const updateMessage = messageService.updateMessage
export const markAsRead = messageService.markAsRead
export const markAsProcessed = messageService.markAsProcessed
export const deleteMessage = messageService.deleteMessage
export const getUnreadCount = messageService.getUnreadCount
export const getRecentNotifications = messageService.getRecentNotifications
export const markAllAsRead = messageService.markAllAsRead
export const markAllAsProcessed = messageService.markAllAsProcessed
export const getMessageSettings = messageService.getMessageSettings
export const updateMessageSettings = messageService.updateMessageSettings
export const getSentMessages = messageService.getMessages // 复用getMessages函数
export const getReceivedMessages = messageService.getReceivedMessages
export const sendMessage = messageService.createMessage // 复用createMessage函数
