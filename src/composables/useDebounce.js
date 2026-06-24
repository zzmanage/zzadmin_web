import { ref, watch } from 'vue'

/**
 * 防抖函数组合式钩 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Object} - 包含防抖函数和取消函 */
export function useDebounce(fn, delay = 300) {
  let timer = null
  
  const debouncedFn = (...args) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  return { debouncedFn, cancel }
}

/**
 * 防抖值组合式钩子
 * @param {any} initialValue - 初始 * @param {number} delay - 延迟时间(ms)
 * @returns {Object} - 包含原始值和防抖后的 */
export function useDebouncedRef(initialValue, delay = 300) {
  const value = ref(initialValue)
  const debouncedValue = ref(initialValue)
  let timer = null
  
  watch(value, (newValue) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  return { value, debouncedValue, cancel }
}
