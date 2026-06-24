import { apiPost } from '../utils/api/apiRequestWrapper'

/**
 * 上传用户头像
 * @param {File} file - 头像文件
 * @returns {Promise}
 */
export const uploadUserAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  
  const response = await apiPost('/api/users/avatar/', formData, '上传用户头像', {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  
  return response
}

/**
 * 修改用户密码
 * @param {Object} passwordData - 密码相关数据
 * @param {string} passwordData.current_password - 当前密码
 * @param {string} passwordData.new_password - 新密 * @param {string} passwordData.confirm_password - 确认新密 * @returns {Promise}
 */
export const changeUserPassword = async (passwordData) => {
  const response = await apiPost('/api/auth/change_password/', passwordData, '修改用户密码')
  return response
}

/**
 * 发送手机验证码
 * @param {string} mobile - 手机号码
 * @returns {Promise}
 */
export const sendVerificationCode = async (mobile) => {
  const response = await apiPost('/api/users/send_verification_code/', mobile, '发送手机验证码')
  return response
}

/**
 * 绑定手机号码
 * @param {Object} bindData - 绑定手机相关数据
 * @param {string} bindData.mobile - 手机号码
 * @param {string} bindData.verification_code - 验证 * @returns {Promise}
 */
export const bindUserPhone = async (bindData) => {
  const response = await apiPost('/api/users/bind_phone/', bindData, '绑定手机号码')
  return response
}