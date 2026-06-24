// 验证工具函数

/**
 * 验证邮箱格式
 * @param {String} email - 邮箱地址
 * @returns {Boolean} - 是否为有效的邮箱格式
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * 验证手机号码格式（中国）
 * @param {String} phone - 手机号码
 * @returns {Boolean} - 是否为有效的手机号码格式
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证密码强度
 * @param {String} password - 密码
 * @returns {Object} - 包含密码强度信息的对 */
export const validatePasswordStrength = (password) => {
  if (!password) {
    return { valid: false, message: '密码不能为空', strength: 0 }
  }
  
  let strength = 0
  
  // 长度检查
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  
  // 字符类型检查
  if (/[A-Z]/.test(password)) strength += 1 // 大写字母
  if (/[a-z]/.test(password)) strength += 1 // 小写字母
  if (/\d/.test(password)) strength += 1 // 数字
  if (/[^A-Za-z0-9]/.test(password)) strength += 1 // 特殊字符
  
  // 计算强度百分比
  const strengthPercentage = Math.min(100, Math.round((strength / 6) * 100))
  
  // 生成强度描述
  let message = ''
  if (strengthPercentage < 30) {
    message = '弱：建议增加密码长度和复杂度'
  } else if (strengthPercentage < 70) {
    message = '中：可以增加更多字符类型'
  } else {
    message = '强：密码强度良好'
  }
  
  // 密码必须至少8个字符，包含字母和数字
  const valid = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
  
  return { valid, message, strength: strengthPercentage }
}

/**
 * 验证身份证号码（中国 * @param {String} idCard - 身份证号 * @returns {Boolean} - 是否为有效的身份证号 */
export const isValidIdCard = (idCard) => {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return idCardRegex.test(idCard)
}

/**
 * 验证URL格式
 * @param {String} url - URL地址
 * @returns {Boolean} - 是否为有效的URL格式
 */
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证中文字符
 * @param {String} text - 文本内容
 * @returns {Boolean} - 是否只包含中文字 */
export const isChineseOnly = (text) => {
  const chineseRegex = /^[\u4e00-\u9fa5]+$/
  return chineseRegex.test(text)
}

/**
 * 验证是否为数字（整数或小数）
 * @param {String|Number} value - 要验证的值
 * @returns {Boolean} - 是否为数
 */
export const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

/**
 * 验证是否为整数
 * @param {String|Number} value - 要验证的值
 * @returns {Boolean} - 是否为整数
 */
export const isInteger = (value) => {
  const integerRegex = /^-\d+$/
  return integerRegex.test(value)
}