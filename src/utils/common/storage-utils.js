// 存储工具函数

/**
 * 设置本地存储
 * @param {String} key - 存储键名
 * @param {*} value - 存储值
 */
export const setLocalStorage = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
  } catch (error) {
    console.error(`Error setting localStorage item '${key}':`, error)
  }
}

/**
 * 获取本地存储
 * @param {String} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {*} - 存储的值或默认值
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    
    if (!item || item === '' || item === 'undefined') {
      return defaultValue
    }

    const parsedValue = JSON.parse(item)
    return parsedValue
  } catch (error) {
    console.error(`Error getting localStorage item '${key}':`, error)
    return defaultValue
  }
}

/**
 * 删除本地存储
 * @param {String} key - 存储键名
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing localStorage item '${key}':`, error)
  }
}

/**
 * 清空所有本地存储
 */
export const clearLocalStorage = () => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

/**
 * 设置会话存储
 * @param {String} key - 存储键名
 * @param {*} value - 存储值
 */
export const setSessionStorage = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value)
    sessionStorage.setItem(key, serializedValue)
  } catch (error) {
    console.error(`Error setting sessionStorage item '${key}':`, error)
  }
}

/**
 * 获取会话存储
 * @param {String} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {*} - 存储的值或默认值
 */
export const getSessionStorage = (key, defaultValue = null) => {
  try {
    const item = sessionStorage.getItem(key)

    if (!item || item === '' || item === 'undefined') {
      return defaultValue
    }

    const parsedValue = JSON.parse(item)
    return parsedValue
  } catch (error) {
    console.error(`Error getting sessionStorage item '${key}':`, error)
    return defaultValue
  }
}

/**
 * 删除会话存储
 * @param {String} key - 存储键名
 */
export const removeSessionStorage = (key) => {
  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing sessionStorage item '${key}':`, error)
  }
}

/**
 * 清空所有会话存储
 */
export const clearSessionStorage = () => {
  try {
    sessionStorage.clear()
  } catch (error) {
    console.error('Error clearing sessionStorage:', error)
  }
}

/**
 * 智能存储函数，根据数据类型选择合适的存储方式
 * @param {String} key - 存储键名
 * @param {*} value - 存储值
 * @param {Boolean} isPersistent - 是否需要持久化存储（true: localStorage, false: sessionStorage）
 */
export const setSmartStorage = (key, value, isPersistent = false) => {
  if (isPersistent) {
    setLocalStorage(key, value)
  } else {
    setSessionStorage(key, value)
  }
}

/**
 * 获取存储
 * @param {String} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @param {Boolean} checkLocalStorage - 是否检查本地存储
 * @returns {*} - 存储的值或默认值
 */
export const getStorageByKey = (key, defaultValue = null, checkLocalStorage = false) => {
  const sessionValue = getSessionStorage(key)   
  if (sessionValue !== null && sessionValue !== undefined) {
    return sessionValue
  }

  if (checkLocalStorage) {
    return getLocalStorage(key, defaultValue)
  }

  return defaultValue
}

/**
 * 存储类型定义，用于明确哪些数据应该存放在哪个位置
 */
export const STORAGE_TYPES = {
  SESSION: {
    AUTH_TOKEN: 'auth_token',
    USER_ID: 'user_id',
    CSRF_TOKEN: 'csrf_token',
    SESSION_ID: 'session_id',
    TENANT_ID: 'tenant_id',
    TENANT_NAME: 'tenant_name',
    TENANT_ROLE: 'tenant_role',
  },

  LOCAL: {   
    USER_PREFERENCES: 'user_preferences',
    THEME_SETTINGS: 'theme_settings',
    LAYOUT_STATE: 'layout_state',
    CACHE_DATA: 'cache_data',
    RECENT_ACTIVITIES: 'recent_activities'
  }
}

/**
 * 安全删除存储的认证信息
 */
export const clearAuthStorage = () => {
  Object.values(STORAGE_TYPES.SESSION).forEach(key => {
    removeSessionStorage(key)
  })

  removeLocalStorage('remembered_user')
}