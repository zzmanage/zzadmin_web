import { ref } from 'vue'

/**
 * 异步操作组合式钩 * @param {Function} asyncFn - 异步函数
 * @returns {Object} - 包含执行状态和方法
 */
export function useAsync(asyncFn) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  
  const execute = async (...args) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await asyncFn(...args)
      data.value = result
      return { success: true, data: result }
    } catch (err) {
      error.value = err
      console.error('Async operation failed:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }
  
  return {
    data,
    error,
    loading,
    execute
  }
}

/**
 * 自动执行的异步组合式钩子
 * @param {Function} asyncFn - 异步函数
 * @param {any[]} args - 初始参数
 * @param {boolean} immediate - 是否立即执行
 */
export function useAsyncAuto(asyncFn, args = [], immediate = true) {
  const { data, error, loading, execute } = useAsync(asyncFn)
  
  if (immediate) {
    execute(...args)
  }
  
  return {
    data,
    error,
    loading,
    refresh: execute
  }
}

/**
 * 带缓存的异步操作组合式钩 * @param {Function} asyncFn - 异步函数
 * @param {number} cacheTime - 缓存时间(ms)
 */
export function useAsyncCached(asyncFn, cacheTime = 5000) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  let lastFetchTime = null
  
  const execute = async (...args) => {
    const now = Date.now()
    
    if (data.value !== null && lastFetchTime && now - lastFetchTime < cacheTime) {
      return { success: true, data: data.value, cached: true }
    }
    
    loading.value = true
    error.value = null
    
    try {
      const result = await asyncFn(...args)
      data.value = result
      lastFetchTime = Date.now()
      return { success: true, data: result, cached: false }
    } catch (err) {
      error.value = err
      console.error('Async operation failed:', err)
      return { success: false, error: err }
    } finally {
      loading.value = false
    }
  }
  
  const invalidateCache = () => {
    lastFetchTime = null
    data.value = null
  }
  
  return {
    data,
    error,
    loading,
    execute,
    invalidateCache
  }
}
