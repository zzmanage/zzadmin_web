<template>
  <el-dialog
    title="租户用户管理"
    :visible="modelValue"
    width="800px"
    @update:visible="(val) => emit('update:modelValue', val)"
  >
    <div v-if="tenant">
      <div style="margin-bottom: 20px;">
        <span class="label">租户名称</span>
        <span>{{ tenant.name }}</span>
      </div>
      
      <!-- 搜索用户 -->
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名或邮箱"
        style="margin-bottom: 20px;"
      >
        <template #append>
          <el-button @click="loadUsers">搜索</el-button>
        </template>
      </el-input>

      <!-- 用户列表 -->
      <el-table
        :data="filteredUsers"
        :loading="loading"
        border
        style="width: 100%;"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column 
          type="selection" 
          width="55"
          :selectable="row => !getTenantRole(row.id)"
        ></el-table-column>
        <el-table-column prop="id" label="用户ID" width="80"></el-table-column>
        <el-table-column label="用户" width="150">
          <template #default="{row}">
            {{ row.user.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="邮箱">
          <template #default="{row}">
            {{ row.user.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="角色" width="150">
          <template #default="{row}">
            <span v-if="row.roles && row.roles.length > 0">
              <el-tag v-for="role in row.roles" :key="role.id" size="small" style="margin-right: 4px;">
                {{ role.name }}
              </el-tag>
            </span>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="tenantRole" label="租户角色" width="150">
          <template #default="{row}">
            <span v-if="getTenantRole(row.id)" class="role-tag">
              {{ roleMap[getTenantRole(row.id)] }}
            </span>
            <span v-else style="color: #999;">未关联</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{row}">
            <template v-if="getTenantRole(row.id)">
              <el-button size="small" type="primary" @click="editRole(row)">修改角色</el-button>
              <el-button size="small" type="danger" @click="removeUser(row)">移除</el-button>
            </template>
            <span v-else style="color: #999;">未关联</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 已选用户操作 -->
      <div v-if="selectedUsers.length > 0" style="margin-top: 20px;">
        <span>已选择 {{ selectedUsers.length }} 个用户</span>
        <el-button type="primary" style="margin-left: 20px;" @click="assignUsers">添加到租户</el-button>
      </div>
    </div>

    <!-- 修改角色弹窗 -->
    <el-dialog title="修改租户角色" v-model="roleDialogVisible" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="用户">
          <span>{{ currentUser.user.username || currentUser.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="roleForm.role" placeholder="请选择角色">
            <el-option label="租户管理员" value="admin"></el-option>
            <el-option label="租户经理" value="manager"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeRoleDialog">取消</el-button>
        <el-button type="primary" @click="saveRole">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addTenantUser, updateTenantUser, removeTenantUser, getTenantUserList } from '../api/tenant'
import { getUserList } from '../api/user'

// 组件属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  tenant: {
    type: Object,
    default: null
  }
})

// 组件事件
const emit = defineEmits(['update:modelValue', 'change'])

// 内部状态
const loading = ref(false)
const allUsers = ref([])
const tenantUsers = ref({})
const searchKeyword = ref('')
const selectedUsers = ref([])
const roleDialogVisible = ref(false)
const currentUser = ref(null)
const roleForm = reactive({ role: 'user' })

// 角色映射
const roleMap = {
  admin: '租户管理员',
  manager: '租户经理',
  user: '普通用户'
}

// 过滤后的用户列表
const filteredUsers = computed(() => {
  if (!searchKeyword.value) return allUsers.value
  const keyword = searchKeyword.value.toLowerCase()
  return allUsers.value.filter(user => {
    const username = user.user.username || user.username || ''
    const email = user.user.email || user.email || ''
    return username.toLowerCase().includes(keyword) ||
           email.toLowerCase().includes(keyword)
  })
})

// 获取用户在租户中的角色
const getTenantRole = (userId) => {
  return tenantUsers.value[userId] || null
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.tenant) {
    loadUsers()
  } else if (!newVal) {
    allUsers.value = []
    tenantUsers.value = {}
    selectedUsers.value = []
    searchKeyword.value = ''
  }
})

// 加载用户列表
async function loadUsers() {
  if (!props.tenant) return
  
  loading.value = true
  try {
    const [usersResponse, tenantUsersResponse] = await Promise.all([
      getUserList(),
      getTenantUserList({ tenant: props.tenant.id })
    ])
    
    // extractData 已经处理了响应，直接使用
    // usersResponse 可能是分页格式或数组
    let usersData = usersResponse
    if (usersResponse && usersResponse.results) {
      usersData = usersResponse.results
    }
    
    allUsers.value = Array.isArray(usersData) ? usersData : []
    
    // 租户用户关联数据
    let tenantData = tenantUsersResponse
    if (tenantUsersResponse && tenantUsersResponse.results) {
      tenantData = tenantUsersResponse.results
    }
    tenantUsers.value = {}
    if (Array.isArray(tenantData)) {
      tenantData.forEach(item => {
        // item.user auth_user 对象，item.user.id auth_user.id
        // 我们需要找到对应的 UserProfile，使UserProfile.id 作为 key
        const userProfile = allUsers.value.find(u => u.user.id === item.user.id)
        if (userProfile) {
          tenantUsers.value[userProfile.id] = item.role
        }
      })
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
    allUsers.value = []
    tenantUsers.value = {}
  } finally {
    loading.value = false
  }
}

// 用户选择改变
function handleSelectionChange(val) {
  selectedUsers.value = val
}

// 将选中用户添加到租户
async function assignUsers() {
  if (!props.tenant || selectedUsers.value.length === 0) return
  
  loading.value = true
  try {
    for (const user of selectedUsers.value) {
      // user.id UserProfile id，user.user.id Django User id
      // 后端 TenantUser 模型需要的User id
      const userId = user.user.id || user.id
      await addTenantUser(props.tenant.id, userId, 'user')
      // 更新映射，使UserProfile id 作为 key
      tenantUsers.value[user.id] = 'user'
    }
    ElMessage.success(`成功添加 ${selectedUsers.value.length} 个用户到租户`)
    selectedUsers.value = []
    // 重新加载用户列表
    await loadUsers()
    emit('change')
  } catch (error) {
    console.error('添加用户失败:', error)
    ElMessage.error('添加用户失败')
  } finally {
    loading.value = false
  }
}

// 编辑角色
function editRole(row) {
  currentUser.value = row
  roleForm.role = getTenantRole(row.id) || 'user'
  roleDialogVisible.value = true
}

// 保存角色变更
async function saveRole() {
  if (!props.tenant || !currentUser.value) return
  
  try {
    // currentUser.value.id UserProfile id，currentUser.value.user.id Django User id
    const userId = currentUser.value.user.id || currentUser.value.id
    await updateTenantUser(props.tenant.id, userId, roleForm.role)
    tenantUsers.value[currentUser.value.id] = roleForm.role
    ElMessage.success('角色更新成功')
    closeRoleDialog()
    emit('change')
  } catch (error) {
    console.error('更新角色失败:', error)
    ElMessage.error('更新角色失败')
  }
}

// 关闭角色弹窗
function closeRoleDialog() {
  roleDialogVisible.value = false
  currentUser.value = null
  roleForm.role = 'user'
}

// 移除租户用户
async function removeUser(row) {
  if (!props.tenant) return
  
  ElMessageBox.confirm('确定要将此用户从租户中移除吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      // row.id UserProfile id，row.user.id Django User id
      const userId = row.user.id || row.id
      await removeTenantUser(props.tenant.id, userId)
      delete tenantUsers.value[row.id]
      ElMessage.success('移除成功')
      emit('change')
    } catch (error) {
      console.error('移除失败:', error)
      ElMessage.error('移除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消操)
  })
}
</script>

<style scoped>
.role-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  background-color: #409eff;
}
</style>
