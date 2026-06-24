import { ref, watch } from 'vue'

/**
 * 节流函数组合式钩 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 节流时间(ms)
 * @returns {Object} - 包含节流函数和取消函 */
export function useThrottle(fn, delay = 300) {
  let lastTime = 0
  let timer = null
  
  const throttledFn = (...args) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    } else {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        lastTime = Date.now()
        fn(...args)
      }, delay - (now - lastTime))
    }
  }
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastTime = 0
  }
  
  return { throttledFn, cancel }
}

/**
 * 节流值组合式钩子
 * @param {any} initialValue - 初始 * @param {number} delay - 节流时间(ms)
 * @returns {Object} - 包含原始值和节流后的 */
export function useThrottledRef(initialValue, delay = 300) {
  const value = ref(initialValue)
  const throttledValue = ref(initialValue)
  let lastTime = 0
  let timer = null
  
  watch(value, (newValue) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      throttledValue.value = newValue
    } else {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        lastTime = Date.now()
        throttledValue.value = newValue
      }, delay - (now - lastTime))
    }
  })
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastTime = 0
  }
  
  return { value, throttledValue, cancel }
}
