<template>
  <div class="user-center">
    <el-card class="user-center-header" shadow="hover">
      <div class="user-header-content">
        <h1 class="user-center-title">用户中心</h1>
        <p class="user-center-subtitle">修改用户基本信息和安全设置</p>
      </div>
    </el-card>

    <el-row class="user-info" gutter="20">
      <el-col :span="8">
        <el-card class="user-info-card" shadow="hover">
          <div class="user-profile-section">
            <div class="user-avatar-container">
              <div class="user-avatar-wrapper">
                <img :src="user.avatar" alt="Avatar" class="user-avatar" >
                <div class="avatar-upload-overlay">
                  <el-upload
                    class="avatar-upload"
                    show-file-list="false"
                    action="#"
                    :on-change="handleAvatarChange"
                  >
                    <i class="el-icon-camera"></i>
                  </el-upload>
                </div>
              </div>
              <h2 class="user-info-name">{{ user.name }}</h2>
              <p class="user-info-desc">{{ user.description }}</p>
            </div>

            <el-divider/>

            <div class="user-info-details">
              <div class="user-info-item">
                <i class="el-icon-user"></i>
                <span>{{ user.position }}</span>
              </div>
              <div class="user-info-item">
                <i class="el-icon-building"></i>
                <span>{{ user.company }}</span>
              </div>
              <div class="user-info-item">
                <i class="el-icon-location-information"></i>
                <span>{{ user.location }}</span>
              </div>
              <div class="user-info-item">
                <i class="el-icon-school"></i>
                <span>{{ user.skills }}</span>
              </div>
            </div>

            <el-divider/>

            <div class="user-tags-section">
              <h6>专业标签</h6>
              <div class="user-info-tags">
                <el-tag v-for="(tag, index) in user.tags" :key="index" type="info" size="mini" class="user-tag">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="user-edit-card" shadow="hover">
          <div class="user-info-tabs">
            <el-tabs v-model="activeTab" type="border-card" class="custom-tabs">
              <el-tab-pane label="基本信息" name="basic">
                <el-form :model="userInfoForm" :rules="rules" ref="formRef" class="info-form">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="姓名" prop="name">
                        <el-input v-model="userInfoForm.name" placeholder="请输入姓名" clearable/>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="性别" prop="gender">
                        <el-select v-model="userInfoForm.gender" placeholder="请选择性别" clearable>
                          <el-option label="男" :value="1"/>
                          <el-option label="女" :value="2"/>
                          <el-option label="保密" :value="0"/>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="联系方式" prop="mobile">
                        <el-input v-model="userInfoForm.mobile" placeholder="请输入手机号" clearable/>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="邮箱" prop="email">
                        <el-input v-model="userInfoForm.email" placeholder="请输入邮箱地址" clearable/>
                      </el-form-item>
                    </el-col>
                    <el-col :span="24">
                      <el-form-item label="详细地址" prop="address">
                        <el-input v-model="userInfoForm.address" placeholder="请输入详细地址" clearable/>
                      </el-form-item>
                    </el-col>
                    <el-col :span="24">
                      <el-form-item label="个人简介" prop="remark">
                        <el-input 
                          type="textarea" 
                          v-model="userInfoForm.remark" 
                          placeholder="请输入个人简介"
                          rows="4"
                          resize="vertical"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-form-item>
                    <el-button type="primary" @click="saveChanges" :loading="saving">
                      <i class="el-icon-check" v-if="!saving"></i>
                      <i class="el-icon-loading" v-else></i>
                      保存更改
                    </el-button>
                    <el-button @click="cancelEdit" v-if="formEdited">取消</el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>
              <el-tab-pane label="安全设置" name="security">
                <div class="security-settings">
                  <el-alert
                    title="安全提示"
                    type="info"
                    :closable="false"
                    show-icon
                  >
                    定期修改密码可以提高账号安全                  </el-alert>
                  <el-card class="security-item" shadow="hover">
                    <div class="security-item-content">
                      <div class="security-item-info">
                        <h4>修改密码</h4>
                        <p>上次修改时间023-12-15</p>
                      </div>
                      <el-button type="primary" @click="showChangePasswordDialog">修改</el-button>
                    </div>
                  </el-card>
                  <el-card class="security-item" shadow="hover">
                    <div class="security-item-content">
                      <div class="security-item-info">
                        <h4>绑定手机</h4>
                        <p>当前绑定：{{ userInfoForm.mobile || '未绑定' }}</p>
                      </div>
                      <el-button type="primary" @click="showBindPhoneDialog">绑定</el-button>
                    </div>
                  </el-card>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改密码对话-->
    <el-dialog
      title="修改密码"
      v-model="changePasswordDialogVisible"
      width="500px"
      :before-close="handleClosePasswordDialog"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" class="password-form"  label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword" class="password-input-item">
          <el-input 
            v-model="passwordForm.currentPassword" 
            :type="passwordVisibility.currentPassword ? 'text' : 'password'" 
            placeholder="请输入当前密码"
            clearable
          >
            <template #suffix>
              <i 
                class="el-icon-view" 
                :class="{ 'el-icon-hide': passwordVisibility.currentPassword }"
                @click="togglePasswordVisibility('currentPassword')"
              ></i>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword" class="password-input-item">
          <el-input 
            v-model="passwordForm.newPassword" 
            :type="passwordVisibility.newPassword ? 'text' : 'password'" 
            placeholder="请输入新密码"
            clearable
          >
            <template #suffix>
              <i 
                class="el-icon-view" 
                :class="{ 'el-icon-hide': passwordVisibility.newPassword }"
                @click="togglePasswordVisibility('newPassword')"
              ></i>
            </template>
          </el-input>
          
          <!-- 密码强度指示-->
          <div v-if="passwordForm.newPassword" class="password-strength-container">
            <div class="password-strength-bar">
              <div 
                class="password-strength-fill" 
                :style="{ width: (passwordStrength.value * 20) + '%' }"
                :class="['strength-' + passwordStrength.value]"
              ></div>
            </div>
            <span class="password-strength-text">密码强度: {{ passwordStrengthText }}</span>
          </div>
          
          <!-- 密码规则提示 -->
          <div class="password-rules-tips">
            <small>密码应包含字母、数字和特殊字符，长度8-20位</small>
          </div>
        </el-form-item>
        
        <el-form-item label="确认新密码" prop="confirmPassword" class="password-input-item">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            :type="passwordVisibility.confirmPassword ? 'text' : 'password'" 
            placeholder="请再次输入新密码"
            clearable
          >
            <template #suffix>
              <i 
                class="el-icon-view" 
                :class="{ 'el-icon-hide': passwordVisibility.confirmPassword }"
                @click="togglePasswordVisibility('confirmPassword')"
              ></i>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClosePasswordDialog">取消</el-button>
          <el-button type="primary" @click="changePassword">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 绑定手机对话-->
    <el-dialog
      title="绑定手机"
      v-model="bindPhoneDialogVisible"
      width="500px"
      :before-close="handleCloseBindPhoneDialog"
    >
      <el-form :model="bindPhoneForm" :rules="bindPhoneRules" ref="bindPhoneFormRef" class="bind-phone-form" label-width="100px">
        <el-form-item label="手机号码" prop="mobile">
          <el-input v-model="bindPhoneForm.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="验证码" prop="verificationCode">
          <el-row :gutter="10">
            <el-col :span="16">
              <el-input v-model="bindPhoneForm.verificationCode" placeholder="请输入验证码"/>
            </el-col>
            <el-col :span="8">
              <el-button type="primary" @click="sendVerificationCode" style="width: 100%;">
                获取验证              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseBindPhoneDialog">取消</el-button>
          <el-button type="primary" @click="bindPhone">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, reactive, ref, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserDetail, updateUser } from '../api/user'
import { useUserStore } from '../store/user'
import { uploadUserAvatar, changeUserPassword, sendVerificationCode, bindUserPhone } from '../api/userSettings'
import { isAuthenticated } from '../utils/auth'

export default defineComponent({
  name: 'UserSetting',
  
  setup() {
        
    const userStore = useUserStore()
    
    const formRef = ref(null)
    const passwordFormRef = ref(null)
    const activeTab = ref('basic')
    const saving = ref(false)
    const formEdited = ref(false)
    const changePasswordDialogVisible = ref(false)
    // 添加缺失的变量定义
    const userProfileId = ref(null)
    const originalFormData = ref({})
    const isEditing = ref(false)

    // 用户基本信息，从API获取，提供默认值
    const user = reactive({
      avatar: 'http://images.django.elevue.djangoadmin.cn/images/user/20230205/2023020512370900029.png',
      name: '系统管理员',
      description: '这是系统管理员账号',
      position: '管理员',
      company: '管理系统',
      location: '中国',
      skills: '系统管理,权限配置',
      tags: ['管理员', '系统维护', '安全管理'],
    })

    const userInfoForm = reactive({
      name: '',
      gender: '',
      mobile: '',
      email: '',
      address: '',
      remark: '',
      department_id: null,
    })

    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    const rules = {
      name: [
        { required: true, message: '请填写姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' }
      ],
      gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
      email: [
        { required: false, message: '请填写邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
      ],
      mobile: [
        { required: false, message: '请填写手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式', trigger: 'blur' }
      ],
      address: [
        { required: false, message: '请填写详细地址', trigger: 'blur' },
        { max: 200, message: '地址长度不能超过200个字', trigger: 'blur' }
      ],
      remark: [
        { required: false, message: '请填写个人简介', trigger: 'blur' },
        { max: 500, message: '个人简介长度不能超过500个字', trigger: 'blur' }
      ]
    }

    const passwordRules = {
      currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度应在6-20位之间', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value !== passwordForm.newPassword) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    }

    // 创建一个标记，用于区分是用户主动修改还是初始化数据
    let isInitializing = false
    
    // 加载用户信息 - 使用me接口获取当前登录用户信息
    const loadUserInfo = async () => {
      try {
        const response = await getUserDetail('me')
        
                
        // 从响应中获取user_profile.id并存放
        if (response && response.id) {
          userProfileId.value = response.id
        }
        
        // 处理用户基本信息
        userInfoForm.name = response.name || ''
        
        userInfoForm.gender = response.gender || ''

        
        userInfoForm.mobile = response.mobile || ''
        userInfoForm.email = response.user.email || ''
        userInfoForm.remark = response.remark || ''
        userInfoForm.department_id = response.department_id || null

        // 保存原始数据用于比较
        originalFormData.value = JSON.parse(JSON.stringify(userInfoForm))
        
        // 检查是否为编辑状态
        isEditing.value = response.is_editing || false
        
              } catch (error) {
        console.error('加载用户信息失败:', error)
        if (error.response && error.response.status === 404) {
          ElMessage.error('用户资料尚未完善')
        } else {
          ElMessage.error('加载用户信息失败，请重试')
        }
      }
    }

    // 处理头像更换
    const handleAvatarChange = async (file) => {
      try {
        // 上传头像到服务器
        const response = await uploadUserAvatar(file.raw)
        
        // 更新头像URL - 从response.data中获取avatar字段的值
        user.avatar = response.data.avatar
        
        ElMessage.success('头像更新成功')
      } catch (error) {
        console.error('头像上传失败:', error)
        console.error('错误详情:', error.response.data || error.message)
        
        // 提供更具体的错误信息
        let errorMsg = '头像上传失败: '
        if (error.response.data.error) {
          errorMsg += error.response.data.error
        } else if (error.response.data.avatar) {
          errorMsg += error.response.data.avatar.join('、')
        } else {
          errorMsg += '未知错误，请重试'
        }
        ElMessage.error(errorMsg)
      }
    }

    // 保存更改
    const saveChanges = async () => {
      try {
        // 修复引用错误：使用formRef而不是未定义的userInfoFormRef
        const isValid = await formRef.value.validate()
        if (!isValid) {
          return
        }
    
        // 组织更新数据 - 添加缺失的必填字段
        const updateData = {
          name: userInfoForm.name,
          gender: userInfoForm.gender,
          mobile: userInfoForm.mobile,
          location: userInfoForm.address,
          remark: userInfoForm.remark,
          user: {
            username: userStore.username,  // 添加必填的username字段
            email: userInfoForm.email
          },
          department_id: originalFormData.value.department_id,  // 添加必填的部门ID
          role_ids: originalFormData.value.roleIds  // 添加必填的角色ID列表
        }
    
                        
        // 优先使用userProfileId，如果没有则回退到userStore.userId
        const response = await updateUser(userProfileId.value || userStore.userId, updateData)
    
                
        // 更新成功后，更新缓存和状态
        if (response) {
          if (response.name) {
            userStore.username = response.name
          }
          // 更新原始数据
          originalFormData.value = JSON.parse(JSON.stringify(userInfoForm))
        }
        
        ElMessage.success('保存成功')
        
      } catch (error) {
        console.error('保存用户信息失败:', error)
        
        // 显示具体错误信息
        if (error.response && error.response.data) {
          if (error.response.data.detail) {
            ElMessage.error(error.response.data.detail)
          } else if (error.response.data.non_field_errors) {
            ElMessage.error(error.response.data.non_field_errors[0])
          } else {
            ElMessage.error('保存失败，请重试')
          }
        } else {
          ElMessage.error('网络错误，请稍后重试')
        }
      }
    }

    // 取消编辑
    const cancelEdit = () => {
      loadUserInfo()
      formEdited.value = false
    }

    // 创建一个函数来重置formEdited为false
    const resetFormEdited = () => {
      formEdited.value = false
    }
    

    
    // 初始化时重置编辑状态
    resetFormEdited()

    // 显示修改密码对话框
    const showChangePasswordDialog = () => {
      changePasswordDialogVisible.value = true
    }

    // 关闭修改密码对话框
    const handleClosePasswordDialog = () => {
      passwordFormRef.value.resetFields()
      changePasswordDialogVisible.value = false
    }

    // 控制密码可见性
    const passwordVisibility = reactive({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    })

    // 切换密码可见性
    const togglePasswordVisibility = (field) => {
      passwordVisibility[field] = !passwordVisibility[field]
    }

    // 密码强度检测
    const passwordStrength = ref(0)
    const passwordStrengthText = ref('')

    // 监听新密码变化，更新密码强度
    watchEffect(() => {
      const password = passwordForm.newPassword
      if (!password) {
        passwordStrength.value = 0
        passwordStrengthText.value = ''
        return
      }

      let strength = 0
      // 长度检测
      if (password.length >= 8) strength += 1
      // 包含数字
      if (/\d/.test(password)) strength += 1
      // 包含小写字母
      if (/[a-z]/.test(password)) strength += 1
      // 包含大写字母
      if (/[A-Z]/.test(password)) strength += 1
      // 包含特殊字符
      if (/[^A-Za-z0-9]/.test(password)) strength += 1

      passwordStrength.value = Math.min(strength, 5)
      
      // 设置密码强度文本
      const strengthTexts = ['', '弱', '中强', '强', '非常强']
      passwordStrengthText.value = strengthTexts[passwordStrength.value]
    })

    // 添加防抖处理，避免频繁触发表单编辑状态
    let formEditTimeout
    watchEffect(() => {
      // 读取所有属性以建立依赖关系
      Object.values(userInfoForm)
      
      // 清除之前的定时器
      if (formEditTimeout) {
        clearTimeout(formEditTimeout)
      }
      
      // 只有在非初始化状态下才设置formEdited为true
      if (!isInitializing) {
        formEditTimeout = setTimeout(() => {
          formEdited.value = true
        }, 300) // 300ms防抖
      }
    })

    // 组件卸载时清除定时器
    onBeforeUnmount(() => {
      if (formEditTimeout) {
        clearTimeout(formEditTimeout)
      }
    })

    // 修改密码
    const changePassword = async () => {
      if (!passwordFormRef.value) return
      
      try {
        await passwordFormRef.value.validate()
        
        // 调用修改密码API
        await changeUserPassword({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword
        })
        
        ElMessage.success('密码修改成功，请重新登录')
        handleClosePasswordDialog()
        
        // 清除密码表单
        Object.keys(passwordForm).forEach(key => {
          passwordForm[key] = ''
        })
        
        // 这里可以添加登出逻辑
      } catch (error) {
        console.error('修改密码失败:', error)
        // 提供更具体的错误信息
        const errorMessage = error.response.data.error || '修改密码失败，请重试'
        ElMessage.error(errorMessage)
      }
    }

    // 绑定手机对话框相关
    const bindPhoneDialogVisible = ref(false)
    const bindPhoneForm = reactive({
      mobile: '',
      verificationCode: '',
    })
    const bindPhoneRules = {
      mobile: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式', trigger: 'blur' }
      ],
      verificationCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { min: 4, max: 6, message: '验证码长度为4-6位', trigger: 'blur' }
      ]
    }
    const bindPhoneFormRef = ref(null)

    // 显示绑定手机对话框
    const showBindPhoneDialog = () => {
      bindPhoneDialogVisible.value = true
    }

    // 关闭绑定手机对话框
    const handleCloseBindPhoneDialog = () => {
      bindPhoneFormRef.value.resetFields()
      bindPhoneDialogVisible.value = false
    }

    // 发送验证码
    const sendVerificationCode = async () => {
      if (!bindPhoneForm.mobile) {
        ElMessage.warning('请先输入手机号码')
        return
      }
      
      try {
        await sendVerificationCode(bindPhoneForm.mobile)
        ElMessage.success('验证码发送成功')
        // 这里可以添加倒计时功能
      } catch (error) {
        console.error('发送验证码失败:', error)
        ElMessage.error('发送验证码失败，请重试')
      }
    }

    // 绑定手机
    const bindPhone = async () => {
      if (!bindPhoneFormRef.value) return
      
      try {
        await bindPhoneFormRef.value.validate()
        
        // 调用绑定手机API
        await bindUserPhone({
          mobile: bindPhoneForm.mobile,
          verification_code: bindPhoneForm.verificationCode
        })
        
        // 更新表单中的手机号码
        userInfoForm.mobile = bindPhoneForm.mobile
        
        ElMessage.success('手机绑定成功')
        handleCloseBindPhoneDialog()
      } catch (error) {
        console.error('手机绑定失败:', error)
        ElMessage.error('手机绑定失败，请重试')
      }
    }

    // 组件挂载时加载用户信息
    onMounted(() => {
            loadUserInfo()
    })

    // 提供手动刷新用户信息的方法，以便在需要时重新加载
    const refreshUserInfo = async () => {
            await loadUserInfo()
      ElMessage.success('用户信息已刷新')
    }

    return {
      user,
      userInfoForm,
      passwordForm,
      passwordVisibility,
      passwordStrength,
      passwordStrengthText,
      rules,
      passwordRules,
      formRef,
      passwordFormRef,
      activeTab,
      saving,
      formEdited,
      changePasswordDialogVisible,
      handleAvatarChange,
      saveChanges,
      cancelEdit,
      showChangePasswordDialog,
      handleClosePasswordDialog,
      changePassword,
      togglePasswordVisibility,
      refreshUserInfo,
      // 绑定手机相关
      bindPhoneDialogVisible,
      bindPhoneForm,
      bindPhoneRules,
      bindPhoneFormRef,
      showBindPhoneDialog,
      handleCloseBindPhoneDialog,
      sendVerificationCode,
      bindPhone
    }
  },
})
</script>

<style scoped>
.user-center {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.user-center-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  overflow: hidden;
}

.user-header-content {
  padding: 30px 20px;
  text-align: center;
}

.user-center-title {
  font-size: 24px;
  margin-bottom: 8px;
  font-weight: 600;
}

.user-center-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.user-info {
  margin-bottom: 20px;
}

.user-info-card,
.user-edit-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.user-info-card:hover,
.user-edit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.user-profile-section {
  padding: 20px;
}

.user-avatar-container {
  text-align: center;
  margin-bottom: 20px;
}

.user-avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 15px;
}

.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #f0f0f0;
  transition: all 0.3s ease;
}

.user-avatar-wrapper:hover .avatar-upload-overlay {
  opacity: 1;
}

.avatar-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.avatar-upload-overlay i {
  color: white;
  font-size: 24px;
}

.user-info-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.user-info-desc {
  color: #606266;
  margin-bottom: 20px;
  font-size: 14px;
}

.user-info-details {
  margin-bottom: 20px;
}

.user-info-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  color: #606266;
  font-size: 14px;
}

.user-info-item i {
  margin-right: 8px;
  color: #909399;
  font-size: 16px;
}

.user-tags-section {
  margin-top: 10px;
}

.user-tags-section h6 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.user-info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  transition: all 0.3s ease;
}

.user-tag:hover {
  transform: scale(1.05);
}

.user-info-tabs {
  padding: 20px;
}

.custom-tabs {
  border-radius: 8px;
  overflow: hidden;
}

.info-form {
  margin-top: 20px;
}

.security-settings {
  margin-top: 20px;
}

.security-item {
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.security-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.security-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.security-item-info h4 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
}

.security-item-info p {
  font-size: 14px;
  color: #909399;
}

.password-form {
      padding: 10px 0;
    }

    .password-input-item {
      margin-bottom: 24px;
    }

    .password-input-item .el-input {
      width: 100%;
    }

    .password-strength-container {
      margin-top: 8px;
    }

    .password-strength-bar {
      height: 6px;
      background-color: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .password-strength-fill {
      height: 100%;
      transition: width 0.3s ease, background-color 0.3s ease;
    }

    .strength-1 .password-strength-fill {
      background-color: #ff4d4f;
    }

    .strength-2 .password-strength-fill {
      background-color: #faad14;
    }

    .strength-3 .password-strength-fill {
      background-color: #faad14;
    }

    .strength-4 .password-strength-fill {
      background-color: #52c41a;
    }

    .strength-5 .password-strength-fill {
      background-color: #52c41a;
    }

    .password-strength-text {
      font-size: 12px;
      color: #606266;
    }

    .password-rules-tips {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .el-input__suffix-inner {
      cursor: pointer;
    }

@media (max-width: 768px) {
  .user-center {
    padding: 10px;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
  }
  
  .user-info-card,
  .user-edit-card {
    margin-bottom: 20px;
  }
}
</style>
  