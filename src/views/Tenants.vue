<template>
  <div>
    <h1>租户管理</h1>
    
    <!-- 查询条件区域 -->
    <SearchForm 
      :form-items="searchFields" 
      :form-data="searchForm"
      @search="handleSearch"
      @reset="resetForm"
      :show-action-buttons="true"
    >
      <template #extra-buttons>
        <el-button type="primary" @click="addTenant" style="margin-right: 10px;">添加租户</el-button>
      </template>
    </SearchForm>
    
    <!-- 租户列表 -->
    <DataTable
      :data="crudData.dataList"
      :columns="tableColumns"
      :loading="crudData.loading"
      :has-selection="true"
      @selection-change="handleSelectionChange"
      :show-empty="true"
      empty-text="暂无租户数据"
      @row-action="handleRowAction"
    >
      <!-- 状态列自定义模-->
      <template #column-status="{row}">
        <el-tag :type="statusMap[row.status].type">
          {{ statusMap[row.status].text }}
        </el-tag>
      </template>
      <!-- 到期日期-->
      <template #column-expires_at="{row}">
        <span :class="{ 'text-danger': row.expires_at && new Date(row.expires_at) < new Date() }">
          {{ row.expires_at ? formatDate(row.expires_at) : '永久' }}
        </span>
      </template>
    </DataTable>

    <!-- 分页控件 -->
    <Pagination 
      v-model:current-page="crudData.currentPage"
      v-model:page-size="crudData.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="crudData.total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 添加/编辑租户弹窗 -->
    <DialogForm
      :title="isEditing  ? '编辑租户' : '添加租户'"
      v-model="dialogVisible"
      :form-data="currentTenant"
      :rules="rules"
      :form-items="formFields"
      @submit="saveTenant"
    />

    <!-- 租户用户管理弹窗 -->
    <el-dialog
      title="租户用户管理"
      v-model="tenantUserDialogVisible"
      width="800px"
    >
      <div v-if="selectedTenant">
        <div style="margin-bottom: 20px;">
          <span class="label">租户名称：</span>
          <span>{{ selectedTenant.name }}</span>
        </div>
        
        <!-- 搜索用户 -->
        <el-input
          v-model="tenantUserSearchKeyword"
          placeholder="搜索用户名或邮箱"
          style="margin-bottom: 20px;"
        >
          <template #append>
            <el-button @click="loadTenantUsers">搜索</el-button>
          </template>
        </el-input>

        <!-- 用户列表 -->
        <el-table
          :data="filteredTenantUsers"
          :loading="tenantUsersLoading"
          border
          style="width: 100%;"
          row-key="id"
          @selection-change="handleTenantUserSelectionChange"
        >
          <el-table-column 
            type="selection" 
            width="55"
            :selectable="row => !getTenantUserRole(row.id)"
          ></el-table-column>
          <el-table-column prop="id" label="用户ID" width="80"></el-table-column>
          <el-table-column prop="username" label="用户名" width="150"></el-table-column>
          <el-table-column prop="email" label="邮箱"></el-table-column>
          <el-table-column prop="tenantRole" label="租户角色" width="120">
            <template #default="{row}">
              <span v-if="getTenantUserRole(row.id)" class="role-tag">
                {{ tenantRoleMap[getTenantUserRole(row.id)] }}
              </span>
              <span v-else style="color: #999;">未关联</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{row}">
              <template v-if="getTenantUserRole(row.id)">
                <el-button size="small" type="primary" @click="editTenantUserRole(row)">修改角色</el-button>
                <el-button size="small" type="danger" @click="removeUserFromTenant(row)">移除</el-button>
              </template>
              <span v-else style="color: #999;">未关联</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 已选用户操作 -->
        <div v-if="selectedTenantUsers.length > 0" style="margin-top: 20px;">
          <span>已选择 {{ selectedTenantUsers.length }} 个用户</span>
          <el-button type="primary" style="margin-left: 20px;" @click="assignTenantUsers">添加到租户</el-button>
        </div>
      </div>

      <!-- 修改角色弹窗 -->
      <el-dialog title="修改租户角色" v-model="tenantRoleDialogVisible" width="400px">
        <el-form :model="tenantRoleForm" label-width="80px">
          <el-form-item label="用户">
            <span>{{ currentTenantUser.user.username || currentTenantUser.username || '-' }}</span>
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="tenantRoleForm.role" placeholder="请选择角色">
              <el-option label="租户管理员" value="admin"></el-option>
              <el-option label="租户经理" value="manager"></el-option>
              <el-option label="普通用户" value="user"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="closeTenantRoleDialog">取消</el-button>
          <el-button type="primary" @click="saveTenantRole">确定</el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTenantList, createTenant, updateTenant, deleteTenant, addTenantUser, updateTenantUser, removeTenantUser, getTenantUsers } from '../api/tenant'
import { formatDate } from '../utils/common/date-utils'
import SearchForm from '../components/SearchForm.vue'
import DataTable from '../components/DataTable.vue'
import DialogForm from '../components/DialogForm.vue'
import Pagination from '../components/Pagination.vue'
import { useCRUD } from '../utils/common/crud-helper'

// 使用CRUD辅助函数管理数据加载和分页
const crudData = useCRUD({
  fetchDataApi: getTenantList,
  defaultParams: {},
  autoLoad: false
})

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  status: ''
})

// 状态映射
const statusMap = {
  0: { text: '未激活', type: 'warning' },
  1: { text: '正常', type: 'success' },
  2: { text: '暂停', type: 'danger' },
  3: { text: '已删除', type: 'info' }
}

// 状态选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '未激活', value: 0 },
  { label: '正常', value: 1 },
  { label: '暂停', value: 2 },
  { label: '已删除', value: 3 },
]

// 弹窗状态
const dialogVisible = ref(false)
const isEditing = ref(false)

// 当前租户数据
const currentTenant = reactive({
  id: null,
  name: '',
  code: '',
  domain: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  max_users: 100,
  expires_at: '',
  status: 1
})

// 选中的项目
const selectedItems = ref([])

// 租户用户管理相关状态
const tenantUserDialogVisible = ref(false)
const selectedTenant = ref(null)
const tenantUsersLoading = ref(false)
const allTenantUsers = ref([])
const tenantUserRoles = ref({})
const tenantUserSearchKeyword = ref('')
const selectedTenantUsers = ref([])
const tenantRoleDialogVisible = ref(false)
const currentTenantUser = ref(null)
const tenantRoleForm = reactive({ role: 'user' })
const tenantRoleMap = {
  admin: '租户管理员',
  manager: '租户经理',
  user: '普通用户'
}

// 过滤后的租户用户列表
const filteredTenantUsers = computed(() => {
  if (!tenantUserSearchKeyword.value) return allTenantUsers.value
  const keyword = tenantUserSearchKeyword.value.toLowerCase()
  return allTenantUsers.value.filter(user => {
    const username = user.username || ''
    const email = user.email || ''
    return username.toLowerCase().includes(keyword) ||
           email.toLowerCase().includes(keyword)
  })
})

// 根据用户ID获取租户角色
const getTenantUserRole = (userId) => {
  return tenantUserRoles.value[userId] || null
}

// 加载租户用户列表
async function loadTenantUsers() {
  if (!selectedTenant.value) return
  
  tenantUsersLoading.value = true
  try {
    // 使用租户用户管理接口获取所有用户及租户角色信息
    const response = await getTenantUsers(selectedTenant.value.id)
    
    // 处理响应数据
    const usersData = response && response.data ? response.data : response
    const usersArray = usersData.results ? usersData.results : usersData
    allTenantUsers.value = Array.isArray(usersArray) ? usersArray : []
    
    // 构建租户角色映射
    tenantUserRoles.value = {}
    allTenantUsers.value.forEach(user => {
      if (user.tenantRole) {
        tenantUserRoles.value[user.id] = user.tenantRole
      }
    })
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
    allTenantUsers.value = []
    tenantUserRoles.value = {}
  } finally {
    tenantUsersLoading.value = false
  }
}

// 用户选择改变
function handleTenantUserSelectionChange(val) {
  selectedTenantUsers.value = val
}

// 将选中用户添加到租户
async function assignTenantUsers() {
  if (!selectedTenant.value || selectedTenantUsers.value.length === 0) return
  
  tenantUsersLoading.value = true
  try {
    for (const user of selectedTenantUsers.value) {
      // user.id 就是 auth_user.id
      const userId = user.id
      await addTenantUser(selectedTenant.value.id, userId, 'user')
      // 更新租户角色映射
      tenantUserRoles.value[user.id] = 'user'
    }
    ElMessage.success(`成功添加 ${selectedTenantUsers.value.length} 个用户到租户`)
    selectedTenantUsers.value = []
    // 重新加载租户用户列表以更新UI
    await loadTenantUsers()
  } catch (error) {
    console.error('添加用户失败:', error)
    ElMessage.error('添加用户失败: ' + (error.message || error))
  } finally {
    tenantUsersLoading.value = false
  }
}

// 编辑角色
function editTenantUserRole(row) {
  currentTenantUser.value = row
  tenantRoleForm.role = getTenantUserRole(row.id) || 'user'
  tenantRoleDialogVisible.value = true
}

// 保存角色变更
async function saveTenantRole() {
  if (!selectedTenant.value || !currentTenantUser.value) return
  
  try {
    // currentTenantUser.value.id 就是 auth_user.id
    const userId = currentTenantUser.value.id
    await updateTenantUser(selectedTenant.value.id, userId, tenantRoleForm.role)
    // 更新租户角色映射
    tenantUserRoles.value[currentTenantUser.value.id] = tenantRoleForm.role
    ElMessage.success('角色更新成功')
    closeTenantRoleDialog()
    // 重新加载以确保数据一致
    await loadTenantUsers()
  } catch (error) {
    console.error('更新角色失败:', error)
    ElMessage.error('更新角色失败')
  }
}

// 关闭角色弹窗
function closeTenantRoleDialog() {
  tenantRoleDialogVisible.value = false
  currentTenantUser.value = null
  tenantRoleForm.role = 'user'
}

// 从租户移除用户
async function removeUserFromTenant(row) {
  if (!selectedTenant.value) return
  
  ElMessageBox.confirm('确定要将此用户从租户中移除吗', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      // row.user.id auth_user.id
      const userId = row.user.id || row.id
      await removeTenantUser(selectedTenant.value.id, userId)
      // 移除租户角色映射
      delete tenantUserRoles.value[row.id]
      ElMessage.success('移除成功')
    } catch (error) {
      console.error('移除失败:', error)
      ElMessage.error('移除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 搜索字段配置
const searchFields = [
  { label: '租户名称', prop: 'name', type: 'input', placeholder: '请输入租户名称' },
  { label: '租户编码', prop: 'code', type: 'input', placeholder: '请输入租户编码' },
  { 
    label: '状态', 
    prop: 'status', 
    type: 'select', 
    width: '120px',
    options: statusOptions
  }
]

// 表格列配置
const tableColumns = [
  { prop: 'id', label: '租户ID', sortable: true, minWidth: 80 },
  { prop: 'name', label: '租户名称', sortable: true, minWidth: 150 },
  { prop: 'code', label: '租户编码', sortable: true, minWidth: 120 },
  { prop: 'domain', label: '域名', minWidth: 150 },
  { prop: 'contact_name', label: '联系人', minWidth: 120 },
  { prop: 'contact_phone', label: '联系电话', minWidth: 130 },
  { prop: 'max_users', label: '最大用户数', minWidth: 100 },
  { prop: 'expires_at', label: '到期日期', minWidth: 120, template: true },
  { prop: 'status', label: '状态', minWidth: 80, template: true },
  { 
    prop: 'created_at',
    label: '创建时间',
    minWidth: 150,
    sortable: true,
    formatter: (row) => formatDate(row.created_at)
  },
  { 
    prop: 'updated_at',
    label: '更新时间',
    minWidth: 150,
    sortable: true,
    formatter: (row) => formatDate(row.updated_at)
  },
  {
    label: '操作',
    width: 240,
    fixed: 'right',
    actions: [
      { text: '编辑', action: 'edit', size: 'small' },
      { text: '管理用户', action: 'manageUsers', size: 'small' },
      { text: '删除', action: 'delete', type: 'danger', size: 'small' }
    ]
  }
]

// 添加/编辑租户表单配置
const formFields = computed(() => [
  { label: '租户名称', prop: 'name', type: 'input', placeholder: '请输入租户名称' },
  { label: '租户编码', prop: 'code', type: 'input', placeholder: '请输入租户编码', disabled: isEditing.value },
  { label: '域名', prop: 'domain', type: 'input', placeholder: '例如: tenant.example.com' },
  { label: '联系人', prop: 'contact_name', type: 'input', placeholder: '请输入联系人姓名' },
  { label: '联系电话', prop: 'contact_phone', type: 'input', placeholder: '请输入联系电话' },
  { label: '联系邮箱', prop: 'contact_email', type: 'input', placeholder: '请输入联系邮箱' },
  { label: '最大用户数', prop: 'max_users', type: 'number', placeholder: '0表示不限', default: 100 },
  { label: '到期日期', prop: 'expires_at', type: 'date', placeholder: '选择到期日期' },
  { 
    label: '状态', 
    prop: 'status', 
    type: 'select', 
    options: [
      { label: '未激活', value: 0 },
      { label: '正常', value: 1 },
      { label: '暂停', value: 2 },
      { label: '已删除', value: 3 },
    ],
    default: 1
  }
])

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入租户编码', trigger: 'blur' }]
}

// 获取搜索参数
const searchParams = computed(() => {
  const params = { ...searchForm }
  Object.keys(params).forEach(key => {
    if (params[key] === '') {
      delete params[key]
    }
  })
  return params
})

// 获取租户列表
async function fetchTenants(params = {}) {
  try {
    const queryParams = {
      ...searchForm,
      ...params,
      page: crudData.currentPage,
      page_size: crudData.pageSize
    }
    await crudData.fetchData(queryParams)
  } catch (error) {
    ElMessage.error('获取租户列表失败')
    console.error('获取租户列表失败:', error)
  }
}

// 处理搜索
function handleSearch(formattedData) {
  crudData.currentPage = 1
  fetchTenants(formattedData)
}

// 重置表单
function resetForm() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = ''
  crudData.currentPage = 1
  fetchTenants()
}

// 分页大小改变
function handleSizeChange(pageSize) {
  crudData.pageSize = pageSize
  fetchTenants()
}

// 当前页改变
function handleCurrentChange(currentPage) {
  crudData.currentPage = currentPage
  fetchTenants()
}

// 选择改变
function handleSelectionChange(val) {
  selectedItems.value = val
}

// 行操作
function handleRowAction({ action, row }) {
  switch (action) {
    case 'edit':
      editTenant(row)
      break
    case 'manageUsers':
      manageTenantUsers(row)
      break
    case 'delete':
      deleteTenantItem(row)
      break
    default:
      console.warn('未知的行操作:', action)
  }
}

// 添加租户
function addTenant() {
  isEditing.value = false
  currentTenant.id = null
  currentTenant.name = ''
  currentTenant.code = ''
  currentTenant.domain = ''
  currentTenant.contact_name = ''
  currentTenant.contact_phone = ''
  currentTenant.contact_email = ''
  currentTenant.max_users = 100
  currentTenant.expires_at = ''
  currentTenant.status = 1
  dialogVisible.value = true
}

// 编辑租户
function editTenant(row) {
  isEditing.value = true
  currentTenant.id = row.id
  currentTenant.name = row.name
  currentTenant.code = row.code
  currentTenant.domain = row.domain || ''
  currentTenant.contact_name = row.contact_name || ''
  currentTenant.contact_phone = row.contact_phone || ''
  currentTenant.contact_email = row.contact_email || ''
  currentTenant.max_users = row.max_users || 100
  currentTenant.expires_at = row.expires_at || ''
  currentTenant.status = row.status
  dialogVisible.value = true
}

// 保存租户
function saveTenant(formData) {
  const data = { ...formData }
  delete data.id
  
  // 处理日期字段，转换为ISO格式或null
  if (data.expires_at) {
    const date = new Date(data.expires_at)
    data.expires_at = date.toISOString()
  } else {
    data.expires_at = null
  }
  
  // 处理空字符串字段，转换为null
  Object.keys(data).forEach(key => {
    if (data[key] === '') {
      data[key] = null
    }
  })
  
  if (isEditing.value) {
    updateTenant(currentTenant.id, data).then(() => {
      dialogVisible.value = false
      fetchTenants()
      ElMessage.success('租户更新成功')
    }).catch(err => {
      console.error('更新失败:', err)
      ElMessage.error('更新失败')
    })
  } else {
    createTenant(data).then(() => {
      dialogVisible.value = false
      fetchTenants()
      ElMessage.success('租户添加成功')
    }).catch(err => {
      console.error('创建失败:', err)
      ElMessage.error('创建失败')
    })
  }
}

// 删除租户
function deleteTenantItem(row) {
  ElMessageBox.confirm('确定要删除此租户吗？', '提示', {
    type: 'warning'
  }).then(() => {
    deleteTenant(row.id).then(() => {
      fetchTenants()
      ElMessage.success('删除成功')
    }).catch(err => {
      console.error('删除失败:', err)
      ElMessage.error('删除失败')
    })
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 组件挂载后获取租户列import { onMounted } from 'vue'
onMounted(() => {
  fetchTenants()
})

// 管理租户用户
async function manageTenantUsers(row) {
  selectedTenant.value = row
  tenantUserDialogVisible.value = true
  // 打开弹窗时自动加载用户列表
  await loadTenantUsers()
}
</script>