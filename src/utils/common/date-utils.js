// 日期格式化工具函数
/**
 * 格式化日期时间
 * @param {string|Date} date - 日期对象或日期字符串
 * @param {string} format - 格式化模板，默认'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  // 处理字符串类型的日期
  if (typeof date === 'string') {
    // 尝试解析日期字符串
    const parsedDate = new Date(date)
    
    // 检查是否为有效日期
    if (isNaN(parsedDate.getTime())) {
      return date // 如果解析失败，返回原始字符串
    }
    
    date = parsedDate
  }
  
  // 处理Date对象
  if (date instanceof Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    // 替换格式化模板中的占位符
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }
  
  return String(date) // 如果既不是字符串也不是Date对象，转换为字符串返回
}

/**
 * 获取相对时间（如小时前，2天前）
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} 相对时间字符串 */
export function getRelativeTime(date) {
  if (!date) return ''
  
  // 处理日期
  if (typeof date === 'string') {
    date = new Date(date)
    if (isNaN(date.getTime())) return date
  }
  
  if (!(date instanceof Date)) {
    return String(date)
  }
  
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}小时前`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}天前`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}年前`
}

/**
 * 获取今天的日期字符串
 * @param {string} format - 格式化模板，默认'YYYY-MM-DD'
 * @returns {string} 今天的日期字符串
 */
export function getToday(format = 'YYYY-MM-DD') {
  return formatDate(new Date(), format)
}

/**
 * 获取昨天的日期字符串
 * @param {string} format - 格式化模板，默认'YYYY-MM-DD'
 * @returns {string} 昨天的日期字符串
 */
export function getYesterday(format = 'YYYY-MM-DD') {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDate(yesterday, format)
}

/**
 * 获取明天的日期字符串
 * @param {string} format - 格式化模板，默认'YYYY-MM-DD'
 * @returns {string} 明天的日期字符串
 */
export function getTomorrow(format = 'YYYY-MM-DD') {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDate(tomorrow, format)
}

/**
 * 判断是否为今天
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {boolean} 是否为今天 */
export function isToday(date) {
  if (!date) return false
  
  if (typeof date === 'string') {
    date = new Date(date)
    if (isNaN(date.getTime())) return false
  }
  
  if (!(date instanceof Date)) {
    return false
  }
  
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}