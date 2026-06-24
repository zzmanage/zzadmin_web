// src/utils/auth.js
import { setSessionStorage, getSessionStorage, removeSessionStorage, STORAGE_TYPES, clearAuthStorage } from './common/storage-utils'

/**
 * 检查用户是否已认证
 * @returns {Boolean} - 是否已认证
 */
export const isAuthenticated = () => {
  return !!getSessionStorage(STORAGE_TYPES.SESSION.AUTH_TOKEN)
}

/**
 * 获取认证令牌
 * @returns {String|null} - 令牌字符串或null
 */
export const getAuthToken = () => {
  return getSessionStorage(STORAGE_TYPES.SESSION.AUTH_TOKEN)
}

/**
 * 设置认证信息
 * @param {Object} authData - 认证数据对象
 * @param {String} authData.token - 访问令牌
 * @param {String} authData.refreshToken - 刷新令牌
 * @param {String} authData.userId - 用户ID
 * @param {String} authData.username - 用户名
 * @param {Object} [authData.userInfo] - 用户信息（可选）
 */
export const setAuthInfo = (authData) => {
  const { token, refreshToken, userId, username, userInfo } = authData

  setSessionStorage(STORAGE_TYPES.SESSION.AUTH_TOKEN, token)
  setSessionStorage(STORAGE_TYPES.SESSION.REFRESH_TOKEN, refreshToken)
  setSessionStorage(STORAGE_TYPES.SESSION.USER_ID, userId)
  setSessionStorage('username', username)
  
  if (userInfo) {
    setSessionStorage('userInfo', userInfo)
  }
}

/**
 * 获取用户信息
 * @returns {Object|null} - 用户信息对象或null
 */
export const getUserInfo = () => {
  return getSessionStorage('userInfo')
}

/**
 * 清除认证信息
 */
export const clearAuthInfo = () => {
  clearAuthStorage()
  removeSessionStorage('username')
  removeSessionStorage('userInfo')
}

/**
 * 检查用户是否有权限
 * @param {String|Array} permissions - 要检查的权限
 * @returns {Boolean} - 是否有权限
 */
export const hasPermission = (permissions) => {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.permissions) {
    return false
  }

  const userPermissions = userInfo.permissions

  if (Array.isArray(permissions)) {
    return permissions.some(permission => userPermissions.includes(permission))
  }

  return userPermissions.includes(permissions)
}