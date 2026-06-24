import { ref, watch } from 'vue'

/**
 * 本地存储组合式钩 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认 * @param {boolean} json - 是否以JSON格式存储
 * @returns {Object} - 包含响应式值和操作方法
 */
export function useLocalStorage(key, defaultValue = null, json = true) {
  const value = ref(defaultValue)
  
  const load = () => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        value.value = json  JSON.parse(stored) : stored
      }
    } catch (error) {
      console.error(`Failed to load from localStorage (${key}):`, error)
      value.value = defaultValue
    }
  }
  
  const save = (newValue) => {
    try {
      const data = json  JSON.stringify(newValue) : newValue
      localStorage.setItem(key, data)
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error)
    }
  }
  
  const remove = () => {
    try {
      localStorage.removeItem(key)
      value.value = defaultValue
    } catch (error) {
      console.error(`Failed to remove from localStorage (${key}):`, error)
    }
  }
  
  load()
  
  watch(value, (newValue) => {
    save(newValue)
  }, { deep: true })
  
  return {
    value,
    load,
    save,
    remove
  }
}

/**
 * SessionStorage组合式钩 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认 * @param {boolean} json - 是否以JSON格式存储
 * @returns {Object} - 包含响应式值和操作方法
 */
export function useSessionStorage(key, defaultValue = null, json = true) {
  const value = ref(defaultValue)
  
  const load = () => {
    try {
      const stored = sessionStorage.getItem(key)
      if (stored !== null) {
        value.value = json  JSON.parse(stored) : stored
      }
    } catch (error) {
      console.error(`Failed to load from sessionStorage (${key}):`, error)
      value.value = defaultValue
    }
  }
  
  const save = (newValue) => {
    try {
      const data = json  JSON.stringify(newValue) : newValue
      sessionStorage.setItem(key, data)
    } catch (error) {
      console.error(`Failed to save to sessionStorage (${key}):`, error)
    }
  }
  
  const remove = () => {
    try {
      sessionStorage.removeItem(key)
      value.value = defaultValue
    } catch (error) {
      console.error(`Failed to remove from sessionStorage (${key}):`, error)
    }
  }
  
  load()
  
  watch(value, (newValue) => {
    save(newValue)
  }, { deep: true })
  
  return {
    value,
    load,
    save,
    remove
  }
}
