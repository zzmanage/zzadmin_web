import { onMounted, onUnmounted } from 'vue'

/**
 * 事件监听器组合式钩子
 * @param {EventTarget} target - 目标对象(如window, document, element)
 * @param {string} eventType - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {Object} options - 事件选项
 */
export function useEventListener(target, eventType, handler, options = {}) {
  onMounted(() => {
    target.addEventListener(eventType, handler, options)
  })
  
  onUnmounted(() => {
    target.removeEventListener(eventType, handler, options)
  })
}

/**
 * 键盘事件监听器组合式钩子
 * @param {Function} handler - 键盘事件处理函数
 * @param {Array} keys - 需要监听的按键列表(可
 */
export function useKeyboardListener(handler, keys = null) {
  const handleKeydown = (event) => {
    if (keys && !keys.includes(event.key)) {
      return
    }
    handler(event)
  }
  
  useEventListener(window, 'keydown', handleKeydown)
}

/**
 * 窗口大小变化监听 * @param {Function} handler - 处理函数
 * @param {number} debounceDelay - 防抖延迟(ms)
 */
export function useResizeListener(handler, debounceDelay = 200) {
  let timer = null
  
  const debouncedHandler = () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      handler()
    }, debounceDelay)
  }
  
  useEventListener(window, 'resize', debouncedHandler)
}

/**
 * 滚动事件监听 * @param {Function} handler - 处理函数
 * @param {number} throttleDelay - 节流延迟(ms)
 */
export function useScrollListener(handler, throttleDelay = 100) {
  let lastTime = 0
  
  const throttledHandler = () => {
    const now = Date.now()
    if (now - lastTime >= throttleDelay) {
      lastTime = now
      handler()
    }
  }
  
  useEventListener(window, 'scroll', throttledHandler)
}
