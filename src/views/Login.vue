<template>
  <div class="login-container">
    <el-form
      :model="loginForm"
      ref="loginFormRef"
      label-width="0px"
      class="login-form"
      @keyup.enter="handleLogin"
    >
      <h2 style="text-align: center">后台管理系统</h2>

      <el-form-item
        prop="username"
        :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]"
      >
        <el-input
          v-model="loginForm.username"
          placeholder="用户名"
          prefix-icon="User"
        />
      </el-form-item>
      
      <el-form-item
        prop="password"
        :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]"
      >
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="密码"
          prefix-icon="Lock"
        />
      </el-form-item>

      <el-form-item
        prop="captcha"
        :rules="[{ required: true, message: '请输入验证码', trigger: 'blur' }]"
      >
        <div class="captcha-container">
          <el-input
            v-model="loginForm.captcha"
            placeholder="验证码"
            prefix-icon="Sunny"
          />
          <div class="captcha" @click="fetchCaptcha">
            <img
              v-if="captchaImage"
              :src="captchaImage"
              alt="验证码"
              class="captcha-image"
            >
          </div>
        </div>
        <!-- 显示验证码图片 -->
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          class="login-btn"
          @click="handleLogin"
          :loading="loginLoading"
        >
          登录
        </el-button>
      </el-form-item>

      <div v-if="loginError" class="login-error">
        {{ loginError }}
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'
import { getCaptcha } from '../api/captcha'
import { getMyTenantRoles } from '../api/tenant'
import { useUserStore } from '../store/user'
import { setSessionStorage, getSessionStorage, removeSessionStorage } from '../utils/common/storage-utils'

const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  username: 'admin',
  password: '123456',
  captcha: ''
})

const loginError = ref('')
const loginLoading = ref(false)
const captchaImage = ref('')
const captchaKey = ref('')

const fetchCaptcha = async () => {
  try {
    // 使用fetch直接请求，不经过request封装（避免token拦截问题）
    const response = await fetch('/api/captcha/get_captcha/')
    
    if (response.ok) {
      // 后端返回JSON格式，包含key和image_base字段
      const data = await response.json()
      if (data && data.key && data.image_base) {
        captchaKey.value = data.key
        captchaImage.value = data.image_base
      } else {
        console.error('Invalid captcha response:', data)
      }
    } else {
      console.error('获取验证码失败:', response.status)
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}

const validateLoginForm = (form) => {
  if (!form.username || form.username.trim() === '') {
    loginError.value = '请输入用户名'
    return false
  }
  if (!form.password || form.password.trim() === '') {
    loginError.value = '请输入密码'
    return false
  }
  if (!form.captcha || form.captcha.trim() === '') {
    loginError.value = '请输入验证码'
    return false
  }
  if (!captchaKey.value || captchaKey.value.trim() === '') {
    loginError.value = '验证码已失效，请重新获取'
    fetchCaptcha()
    return false
  }
  return true
}

const handleLogin = async () => {
  loginError.value = ''
  
  const valid = validateLoginForm(loginForm)

  if (valid) {
    loginLoading.value = true
    try {
      const loginData = await login({
        username: loginForm.username,
        password: loginForm.password,
        captcha: loginForm.captcha,
        captchaKey: captchaKey.value,
      })
      
      if (loginData && loginData.error) {
        throw new Error(loginData.error)
      }
      
      if (loginData && loginData.access && loginData.refresh && loginData.user_id && loginData.username) {
        userStore.login(loginData.username, loginData.access, loginData.refresh, loginData.user_id)
        
        try {
          const tenantRoles = await getMyTenantRoles()
          if (tenantRoles && tenantRoles.length > 0) {
            const tenants = tenantRoles.map(tr => ({
              id: tr.tenant.id || tr.tenant_id,
              name: tr.tenant.name || tr.tenant_name,
              role: tr.role
            }))
            userStore.setTenants(tenants)
          }
        } catch (error) {
          console.error('获取租户列表失败:', error)
        }
        
        const redirectPath = getSessionStorage('redirectAfterLogin')
        if (redirectPath) {
          router.push(redirectPath)
          removeSessionStorage('redirectAfterLogin')
        } else {
          router.push('/dashboard')
        }
      } else {
        console.error('登录数据不完整')
        throw new Error('登录失败：返回数据不完整')
      }
    } catch (error) {
      console.error('登录失败:', error)
      
      let errorMessage = ''
    
      if (error.response && error.response.data) {
        const data = error.response.data
        if (data.detail) errorMessage = data.detail
        else if (data.message) errorMessage = data.message
        else if (data.error) errorMessage = data.error
        else if (typeof data === 'string') errorMessage = data
      
        if (!errorMessage) {
          const fieldErrors = []
          for (const key in data) {
            if (Array.isArray(data[key])) {
              fieldErrors.push(data[key].join(', '))
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(' ')
          }
        }
      }

      if (!errorMessage) {
        if (error.response && error.response.status === 400) {
          errorMessage = '请求参数错误，请检查输入信息'
        } else if (error.response && error.response.status === 401) {
          errorMessage = '用户名、密码或验证码错误'
        } else if (error.response && error.response.status === 403) {
          errorMessage = '账号已被锁定，请联系管理员'
        } else {
          errorMessage = error.message || '登录失败，请重试'
        }
      }

      loginError.value = errorMessage

      fetchCaptcha()
      loginForm.captcha = ''
    } finally {
      loginLoading.value = false
    }
  }
}

onMounted(() => {
  fetchCaptcha()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-form h2 {
  color: #303133;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.captcha-container {
  display: flex;
  gap: 10px;
}

.captcha {
  width: 120px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

.login-error {
  color: #f56c6c;
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-button--primary) {
  border-radius: 4px;
}
</style>