// 权限检查辅助函数
// 这个文件专门用于导出全局可用的辅助函数，确保在组件实例化之前就可以使用
/**
 * 安全检查数据是否包含按钮列
 * @param {Object} data - 需要检查的数据对象
 * @returns {boolean} - 如果数据包含非空按钮数组则返回true，否则返回false
 */
export function safeGetHasButtons(data) {
  try {
    if (!data || typeof data !== 'object') return false
    if (!data.buttons) return false
    if (!Array.isArray(data.buttons)) return false
    return data.buttons.length > 0
  } catch (error) {
    console.error('检查按钮权限时出错:', error)
    return false
  }
}

// 为了确保全局可用性，同时挂载到window对象
if (!window.safeGetHasButtons) {
  window.safeGetHasButtons = safeGetHasButtons
}