// src/api/captcha.js
import { apiGet } from '../utils/api/apiRequestWrapper'

// 使用apiGet请求验证码接口，使用项目代理配置
export const getCaptcha = async () => {
  return await apiGet('/api/captcha/get_captcha/', {}, '获取验证码', true, {
    timeout: 5000,
    responseType: 'blob'
  })
}
