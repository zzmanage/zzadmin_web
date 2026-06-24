<template>
  <div>
    <h1>用户管理</h1>
    
    <!-- 查询条件区域 -->
    <SearchForm 
      :form-items="searchFields" 
      :form-data="searchForm"
      @search="handleSearch"
      @reset="resetForm"
      :show-action-buttons="true"
    >
      <template #extra-buttons>
        <el-button type="primary" @click="addUser" style="margin-right: 10px;">添加用户</el-button>
        <ImportExport
          :api-prefix="'/api/users'"
          :export-params="searchParams"
          :template-filename="'用户管理模板.xlsx'"
          @import-success="handleImportSuccess"
          @import-error="handleImportError"
          style="margin-right: 10px;"
        />
      </template>
    </SearchForm>
    
    <!-- 用户列表 -->
    <DataTable
      :data="crudData.dataList"
      :columns="tableColumns"
      :loading="crudData.loading"
      :has-selection="true"
      @selection-change="handleSelectionChange"
      :show-empty="true"
      empty-text="暂无用户数据"
      @row-action="handleRowAction"
    >
      <!-- 状态列自定义模板 -->
        <template #column-is_active="{row}">
          <el-switch
            :model-value="Boolean(row.user.is_active)"
            active-color="#13ce66"
            inactive-color="#ff4949"
            @change="updateUserStatus(row.id, $event)"
          />
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

    <!-- 添加/编辑用户弹窗 -->
    <DialogForm
      :title="isEditing ? '编辑用户' : '添加用户'"
      v-model="dialogVisible"
      :form-data="currentUser"
      :rules="rules"
      :form-items="formFields"
      @submit="saveUser"
    />
    
    <!-- 重置密码弹窗 -->
    <DialogForm
      title="重置密码"
      v-model="resetPasswordVisible"
      :form-data="resetPasswordForm"
      :rules="resetPasswordRules"
      :form-items="resetPasswordFields"
      @submit="submitResetPassword"
      width="400px"
    />
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword } from '../api/user'
import ImportExport from '../components/ImportExport.vue'
import { formatDate } from '../utils/common/date-utils'
import { getDeptList, getDeptTree } from '../api/dept'
import { getRoleList, getAllRoles } from '../api/role'
import { getPostList, getAllPosts } from '../api/post'
import SearchForm from '../components/SearchForm.vue'
import DataTable from '../components/DataTable.vue'
import DialogForm from '../components/DialogForm.vue'
import StatusTag from '../components/StatusTag.vue'
import BatchActions from '../components/BatchActions.vue'
import Pagination from '../components/Pagination.vue'
import { useCRUD, validateForm } from '../utils/common/crud-helper'

export default {
  name: 'User',
  components: {
    ImportExport,
    SearchForm,
    DataTable,
    DialogForm,
    StatusTag,
    BatchActions,
    Pagination
  },
  computed: {
    // 获取搜索参数（用于导入导出组件）
    searchParams() {
      const params = { ...this.searchForm }
      // 移除空字符串
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key]
        }
      })
      return params
    }
  },
  data() {
    // 使用CRUD辅助函数管理数据加载和分页
    const crudData = useCRUD({
      fetchDataApi: getUserList,
      defaultParams: {},
      autoLoad: false
    })
    
    return {
      crudData,
      searchForm: {
        username: '',
        email: '',
        mobile: '',
        department_id: '',
        is_active: ''
      },
      departments: [],
      roles: [],
      posts: [],
      departmentTree: [],
      currentUser: {
        id: null,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        department_id: null, // 使用department_id与post保持一致的命名风格
        roles: [],
        password: '',
        confirm_password: '',
        is_active: true,
        employee_no: '',
        gender: 0,
        user_type: '0',
        post: null,
        name: ''
      },
      dialogVisible: false,
      resetPasswordVisible: false,
      resetPasswordForm: {
        password: '',
        confirm_password: ''
      },
      resetPasswordUserId: null,
      resetPasswordUsername: '',
      isEditing: false,
      // 搜索表单配置
      searchFields: [
        { label: '账号', prop: 'username', type: 'input' },
        { label: '邮箱', prop: 'email', type: 'input' },
        { label: '手机号', prop: 'mobile', type: 'input' },
        {
          label: '所属部门',
          prop: 'department_id',
          type: 'select',
          width: '160px',
          options: [],
          loadOptions: () => this.fetchDepartments()
        },
        {
          label: '状态',
          prop: 'is_active',
          type: 'select',
          width: '120px',
          options: [
            { label: '全部', value: '' },
            { label: '启用', value: true },
            { label: '禁用', value: false }
          ]
        }
      ],
      // 表格列配置
      tableColumns: [
        { prop: 'id', label: '用户ID', sortable: true, minWidth: 80 },
        { 
          prop: 'user_username', 
          label: '账号', 
          sortable: true, 
          minWidth: 120,
          formatter: (row) => {
            return row.user ? row.user.username : ''
          }
        },
        { prop: 'name', label: '姓名', sortable: true, minWidth: 100 },
        { prop: 'email', label: '邮箱', sortable: true, minWidth: 180 },
        { prop: 'mobile', label: '手机号码', sortable: true, minWidth: 120 },
        { 
          prop: 'department_name', 
          label: '所属部门', 
          sortable: true, 
          minWidth: 120,
          formatter: (row) => {
            // 优先使用预处理好的department_name
            if (row.department_name) {
              return row.department_name
            }
            
            // 后备处理：如果department_name不存在，尝试直接获取部门名称
            if (row.department && row.department.name) {
              return row.department.name
            }
            
            return '未分配'
          }
        },
        { prop: 'employee_no', label: '工号', sortable: true, minWidth: 100, showOverflowTooltip: true },
        {
          prop: 'gender',
          label: '性别',
          sortable: true,
          minWidth: 80,
          tag: true,
          tagType: (row) => row.gender === 1 ? 'info' : (row.gender === 2 ? 'primary' : 'default'),
          formatter: (row) => {
            return this.formatGender(row.gender)
          }
        },
        {
          prop: 'user_type',
          label: '用户类型',
          sortable: true,
          minWidth: 100,
          tag: true,
          tagType: (row) => row.user_type === '0' ? 'success' : (row.user_type === '1' ? 'warning' : 'default'),
          formatter: (row) => {
            return this.formatUserType(row.user_type)
          }
        },
        { 
          prop: 'role_names',
          label: '用户角色',
          sortable: true,
          minWidth: 150,
          formatter: (row) => {
            // 处理不同格式的角色数据
            if (!row.role_names) return '无角色'
            
            // 如果是数组格式
            if (Array.isArray(row.role_names)) {
              return row.role_names.join(', ')
            }
            
            // 如果是对象数组，提取name属性
            if (Array.isArray(row.roles)) {
              return row.roles.map(role => role.name || role).join(', ') || '无角色'
            }
            
            // 如果是字符串直接返回
            if (typeof row.role_names === 'string') {
              return row.role_names || '无角色'
            }
            
            // 其他情况转为字符串
            return String(row.role_names) || '无角色'
          },
          showOverflowTooltip: true
        },
        { 
          prop: 'is_active',
          label: '状态',
          sortable: true,
          minWidth: 100,
          template: true
        },
        { 
          prop: 'created_at',
          label: '创建时间',
          minWidth: 200,
          sortable: true,
          formatter: (row) => {
            return this.formatDateTime(row.created_at)
          }
        },
        { 
          prop: 'updated_at',
          label: '更新时间',
          minWidth: 200,
          sortable: true,
          formatter: (row) => {
            return this.formatDateTime(row.updated_at)
          }
        },
        {
          label: '操作',
          width: 250,
          fixed: 'right',
          actions: [
            { text: '编辑', action: 'edit', size: 'small' },
            { text: '重置密码', action: 'resetPassword', size: 'small' },
            { text: '删除', action: 'delete', type: 'danger', size: 'small' }
          ]
        }

      ],
      // 添加/编辑用户表单配置
      formFields: [
        { label: '账号', prop: 'username', type: 'input', placeholder: '请输入账号' },
        { label: '姓名', prop: 'name', type: 'input', placeholder: '请输入中文名' },
        { label: '姓氏', prop: 'first_name', type: 'input', placeholder: '请输入姓' },
        { label: '名字', prop: 'last_name', type: 'input', placeholder: '请输入名' },
        { label: '邮箱', prop: 'email', type: 'input', placeholder: '请输入邮箱' },
        { label: '手机号码', prop: 'mobile', type: 'input', placeholder: '请输入手机号码' },
        { label: '工号', prop: 'employee_no', type: 'input', placeholder: '请输入工号（可选）' },
        {
          label: '性别',
          prop: 'gender',
          type: 'radio',
          options: [
            { label: '男', value: 1 },
            { label: '女', value: 2 },
            { label: '其他', value: 0 }
          ]
        },
        {
          label: '所属部门',
          prop: 'department_id',
          type: 'cascader',
          options: [],
          props: { label: 'name', value: 'id', checkStrictly: true },
          placeholder: '请选择所属部门',
            loadOptions: () => this.loadUserDataForEdit()
        },
        {
          label: '用户角色',
          prop: 'roles',
          type: 'select',
          options: [],
          multiple: true,
          placeholder: '请选择用户角色',
          loadOptions: () => this.loadUserDataForEdit()
        },
        {
          label: '职位',
          prop: 'post',
          type: 'select',
          options: [],
          placeholder: '请选择职位',
          loadOptions: () => this.loadUserDataForEdit()
        },
        { label: '密码', prop: 'password', type: 'password', placeholder: '请输入密码', hidden: 'isEditing' },
        { label: '确认密码', prop: 'confirm_password', type: 'password', placeholder: '请确认密码', hidden: 'isEditing' },
        { label: '状态', prop: 'is_active', type: 'switch' },
        {          
          label: '用户类型',
          prop: 'user_type',
          type: 'select',
          options: [
            { label: '后台用户', value: '0' },
            { label: '前台用户', value: '1' }
          ],
          placeholder: '请选择用户类型',
          vIf: true,
          valueType: 'string' // 确保值以字符串类型处理
        }
      ],
      // 重置密码表单配置
      resetPasswordFields: [
        { label: '新密码', prop: 'password', type: 'password', placeholder: '请输入新密码' },
        { label: '确认密码', prop: 'confirm_password', type: 'password', placeholder: '请确认新密码' }
      ],
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 2, max: 20, message: '账号长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入中文名', trigger: 'blur' },
          { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        first_name: [
          { required: false, message: '请输入姓', trigger: 'blur' },
          { min: 1, max: 20, message: '姓氏长度在 1 到 20 个字符', trigger: 'blur' }
        ],
        last_name: [
          { required: false, message: '请输入名', trigger: 'blur' },
          { min: 1, max: 20, message: '名字长度在 1 到 20 个字符', trigger: 'blur' }
        ],
        email: [
          { required: false, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        mobile: [
          { required: false, message: '请输入手机号', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式', trigger: 'blur' }
        ],
        employee_no: [
          { required: false, message: '请输入工号', trigger: 'blur' }
        ],
        gender: [
          { required: false, message: '请选择性别', trigger: 'change' }
        ],
        user_type: [
          { required: true, message: '请选择用户类型', trigger: 'change' }
        ],
        department_id: [
          { required: true, message: '请选择所属部门', trigger: 'change' }
        ],
        roles: [
          { required: true, message: '请选择用户角色', trigger: 'change' },
          { type: 'array', min: 1, message: '至少选择一个角色', trigger: 'change' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.isEditing) {
              callback()
            } else if (!value || value.length < 6) {
              callback(new Error(value ? '密码长度不能少于 6 个字符' : '请输入密码'))
            } else {
              callback()
            }
          }}
        ],
        confirm_password: [
          {
            validator: (rule, value, callback) => {
              if (this.isEditing) {
                callback()
              } else if (!value) {
                  callback(new Error('请确认密码'))
                } else if (value !== this.currentUser.password) {
                  callback(new Error('两次输入的密码不一致'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      },
      resetPasswordRules: {
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
        ],
        confirm_password: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value !== this.resetPasswordForm.password) {
                callback(new Error('两次输入的密码不一致'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      }
    }
  },
  created() {
    this.fetchDepartments()
    this.fetchPosts()
    this.fetchRoles()
  },
  mounted() {
    // 组件加载时获取部门数据，确保在用户列表加载前准备好
    this.fetchDepartments()
    // 初始加载用户列表
    this.fetchUsers()
  },
  methods: {
    getUserRoleNames(roles) {
      if (!roles || !roles.length) {
        return '无角色'
      }
      return roles.map(role => role.name || role).join(', ')
    },
    
    getUserRoleName(role) {
      const roleMap = {
        'superadmin': '超级管理员',
        'admin': '管理员',
        'user': '普通用户',
        'readonly': '只读用户'
      }
      return roleMap[role] || role
    },
    
    formatDate,
    
    // 格式化日期时间，确保日期能正确解析
    formatDateTime(date) {
      try {
        return formatDate(date)
      } catch (error) {
        console.error('日期格式化错误', error)
        return date || ''
      }
    },
    
    // 格式化性别显示
    formatGender(gender) {
      // 确保gender是字符串类型，以便在映射中查找
      const genderStr = String(gender)
      const genderMap = {
        'male': '男',
        'female': '女',
        'other': '其他',
        '0': '未知',
        '1': '男',
        '2': '女'
      }
      return genderMap[genderStr] || '未知'
    },
    
    // 格式化用户类型显示
    formatUserType(userType) {
      // 确保userType是字符串类型，以便在映射中查找
      const userTypeStr = String(userType)
      const userTypeMap = {
        '0': '后台用户',
        '1': '前台用户',
        '后台用户': '后台用户',
        '前台用户': '前台用户'
      }
      return userTypeMap[userTypeStr] || '未知'
    },
    
    // 更新用户状态
    async updateUserStatus(userId, status) {
      try {
        // 显示加载状态- 使用'info'类型，因为'loading'不是有效的ElMessage类型
        const loadingInstance = ElMessage({
          message: '正在更新状态...',
          type: 'info',
          duration: 0
        })
        
        // 调用API更新用户状态
        // 根据API要求，传递包含user对象的参数
        const updateData = {
          user: {
            is_active: status
          }
        }
        
        await updateUser(userId, updateData)
        
        // 隐藏加载状态，显示成功消息
        loadingInstance.close()
        ElMessage.success(`用户状态已${status ? '启用' : '禁用'}`)
        
        // 刷新用户列表以确保数据同步
        await this.fetchUsers()
      } catch (error) {
        // 隐藏加载状态，显示错误消息
        ElMessage.closeAll()
        ElMessage.error('更新用户状态失败')
        console.error('更新用户状态失败', error)
        
        // 刷新列表以恢复原始状态
        await this.fetchUsers()
      }
    },
    
    // 处理表格行操作
    handleRowAction({ action, row }) {
      switch (action) {
      case 'edit':
        this.editUser(row)
        break
      case 'delete':
        this.deleteUser(row)
        break
      case 'resetPassword':
        this.resetUserPassword(row)
        break
      case 'updateStatus': {
        // 切换用户状态- 使用正确的嵌套结构row.user.is_active
        const newStatus = !row.user.is_active
        this.updateUserStatus(row.id, newStatus)
        break
      }
      default:
        console.warn('未知的行操作:', action)
      }
    },
    
    // 获取用户列表
    async fetchUsers(params = {}) {
      try {
        // 确保部门数据已加载
        if (!this.departments || this.departments.length === 0) {
          await this.fetchDepartments()
        }
        
        // 准备参数，移除空字符串
        const queryParams = {
          ...this.searchForm,
          ...params,
          page: this.crudData.currentPage,
          page_size: this.crudData.pageSize
        }
        
        // 使用crudData加载数据
        await this.crudData.fetchData(queryParams)
        
        // 处理用户数据
        if (this.crudData.dataList && Array.isArray(this.crudData.dataList)) {
          // 处理用户数据，确保is_active是布尔值并处理角色和部门信息
          this.crudData.dataList = this.crudData.dataList.map(user => {
            // 确保user对象存在
            if (!user.user) {
              user.user = {}
            }
            // 转换is_active为布尔值
            user.user.is_active = Boolean(user.user.is_active)
            
            // 处理角色数据，确保表格能正确显示角色
            if (user.user.roles && Array.isArray(user.user.roles)) {
              // 将嵌套的角色数据映射到顶层role_names字段，供表格显示
              user.role_names = user.user.roles.map(role => role.name || role).join(', ') || '无角色'
            } else if (user.roles && Array.isArray(user.roles)) {
              // 兼容角色数据直接在顶层的情况
              user.role_names = user.roles.map(role => role.name || role).join(', ') || '无角色'
            }
            
            // 处理部门显示数据，预先映射部门名称
            const departmentId = this.getDepartmentId(user)
            // 首先检查用户数据中是否已经包含部门名称
            if (user.department && user.department.name) {
              user.department_name = user.department.name
            } else if (user.user && user.user.department && user.user.department.name) {
              user.department_name = user.user.department.name
            } else if (departmentId) {
              // 尝试通过ID查找部门名称
              if (this.departments && this.departments.length > 0) {
                // 查找对应的部门名称，增加更多匹配条件
                const dept = this.departments.find(d => 
                  d.id === departmentId || 
                  String(d.id) === String(departmentId) ||
                  d.department_id === departmentId ||
                  String(d.department_id) === String(departmentId)
                )
                // 添加部门名称字段，方便表格显示
                user.department_name = dept ? dept.name : String(departmentId)
              } else {
                // 如果没有部门数据，但有ID，直接显示ID
                user.department_name = String(departmentId)
              }
            } else {
              user.department_name = '未分配部门'
            }
            
            return user
          })
        }
      } catch (error) {
        this.$message.error('获取用户列表失败')
        console.error('获取用户列表失败:', error)
      }
    },
    
    fetchDepartments: async function() {
      try {
        // getDeptList已经通过extractData返回了实际的数据
        this.departments = await getDeptList()
        
        // 确保departments是数组
        if (!Array.isArray(this.departments)) {
          this.departments = []
        }
        
        // 更新搜索表单中部门选择器的选项
        if (this.searchFields && this.searchFields.length > 0) {
          const deptField = this.searchFields.find(field => field.prop === 'department_id')
          if (deptField) {
            deptField.options = this.departments.map(dept => ({
              label: dept.name,
              value: dept.id
            }))
          }
        }
      } catch (error) {
        this.$message.error('获取部门列表失败')
        console.error('获取部门列表失败:', error)
      }
    },

    // 获取部门树结构
    fetchDeptTree: async function() {
      try {
        // getDeptTree已经通过extractData返回了实际的数据
        this.departmentTree = await getDeptTree()
        
        // 确保departmentTree是数组
        if (!Array.isArray(this.departmentTree)) {
          this.departmentTree = []
        }
      } catch (error) {
        this.$message.error('获取部门树失败')
        console.error('获取部门树失败', error)
        // 设置默认空数组避免后续操作出错
        this.departmentTree = []
      }
    },

    // 获取用户的部门ID
    getDepartmentId: function(user) {
      if (!user) return null
      
      // 检查多种可能的数据结构，增加更多可能性
      // 1. 检查顶层department_id
      if (user.department_id !== null && user.department_id !== undefined) {
        return user.department_id
      }
      // 2. 检查嵌套的department对象中的id
      if (user.department && user.department.id !== null && user.department.id !== undefined) {
        return user.department.id
      }
      // 3. 处理department字段直接是ID的情况
      if (user.department !== null && user.department !== undefined && typeof user.department !== 'object') {
        return user.department
      }
      // 4. 检查user对象中的department_id
      if (user.user && user.user.department_id !== null && user.user.department_id !== undefined) {
        return user.user.department_id
      }
      // 5. 检查user对象中的department.id
      if (user.user && user.user.department && user.user.department.id !== null && user.user.department.id !== undefined) {
        return user.user.department.id
      }
      // 6. 检查可能的departments数组中的第一个部门
      if (user.departments && Array.isArray(user.departments) && user.departments.length > 0) {
        const firstDept = user.departments[0]
        if (firstDept.id) return firstDept.id
        if (typeof firstDept !== 'object') return firstDept
      }
      // 7. 检查user对象中的departments数组
      if (user.user && user.user.departments && Array.isArray(user.user.departments) && user.user.departments.length > 0) {
        const firstDept = user.user.departments[0]
        if (firstDept.id) return firstDept.id
        if (typeof firstDept !== 'object') return firstDept
      }
      
      return null
    },
    
    // 加载添加/编辑用户所需的数据
    fetchPosts: async function() {        
      try {
        const response = await getAllPosts()
        
        // 处理不同的响应格式
        let posts = []
        if (Array.isArray(response)) {
          posts = response
        } else if (response && response.data && Array.isArray(response.data)) {
          posts = response.data
        } else if (response && response.results && Array.isArray(response.results)) {
          posts = response.results
        } else if (response && response.list && Array.isArray(response.list)) {
          posts = response.list
        } else if (typeof response === 'object' && response.id !== undefined && response.name !== undefined) {
          posts = [response]
        }
        
        this.posts = posts
        return posts
      } catch (error) {
        this.posts = []
        return []
      }
    },

    fetchRoles: async function() {
      try {
        const response = await getAllRoles()
        
        // 处理不同的响应格式
        let roles = []
        if (Array.isArray(response)) {
          roles = response
        } else if (response && response.data && Array.isArray(response.data)) {
          roles = response.data
        } else if (response && response.results && Array.isArray(response.results)) {
          roles = response.results
        } else if (response && response.list && Array.isArray(response.list)) {
          roles = response.list
        } else if (typeof response === 'object' && response.id !== undefined && response.name !== undefined) {
          roles = [response]
        }
        
        this.roles = roles
        return roles
      } catch (error) {
        this.roles = []
        return []
      }
    },
    
    loadUserDataForEdit: async function() {
      // 每次打开对话框都重新加载数据，确保获取最新的部门、角色和职位信息
      try {
        // 分别加载数据
        await this.fetchDeptTree()
        await this.fetchRoles()
        await this.fetchPosts()
        
        // 更新表单字段中的选项列表
        if (this.formFields && this.formFields.length > 0) {
          // 更新部门选项
          const deptField = this.formFields.find(field => field.prop === 'department_id')
          if (deptField) {
            // 确保departmentTree有值，并且是数组格式
            const safeDepartmentTree = Array.isArray(this.departmentTree)  
              ? JSON.parse(JSON.stringify(this.departmentTree)) : []
            
            deptField.options = safeDepartmentTree
            // 确保cascader组件的props配置正确
            deptField.props = {
              label: 'name',
              value: 'id',
              checkStrictly: true
            }
          }
          
          // 更新角色选项
          const roleField = this.formFields.find(field => field.prop === 'roles')
          if (roleField) {
            roleField.options = []
            if (this.roles && Array.isArray(this.roles)) {
              // 过滤出有效的角色数据
              const validRoles = this.roles.filter(role => role && role.id !== undefined)
              
              roleField.options = validRoles.map(role => ({
                label: role.name || '未知角色',
                value: role.id
              })).filter(option => option.label && option.value) // 过滤无效选项
            }
          }
          
          // 更新岗位选项
          const postField = this.formFields.find(field => field.prop === 'post')
          if (postField) {
            postField.options = []
            if (this.posts && Array.isArray(this.posts)) {
              // 过滤出有效的职位数据
              const validPosts = this.posts.filter(post => post && post.id !== undefined)
              
              postField.options = validPosts.map(post => ({
                label: post.name || '未知职位',
                value: post.id
              })).filter(option => option.label && option.value) // 过滤无效选项
            }
          }
          
          // 更新用户类型选项
          const userTypeField = this.formFields.find(field => field.prop === 'user_type')
          if (userTypeField) {
            userTypeField.vIf = true
            userTypeField.options = [
              { label: '后台用户', value: '0' },
              { label: '前台用户', value: '1' }
            ]
          }
        }
      } catch (error) {
        this.$message.error('加载部门、角色或职位数据失败')
      }
    },
    
    handleSearch: function(formattedData) {
      this.crudData.currentPage = 1
      this.fetchUsers(formattedData)
    },

    resetForm: function() {
      this.searchForm = {
        username: '',
        email: '',
        mobile: '',
        department_id: '',
        is_active: ''
      }
      this.crudData.currentPage = 1
      this.fetchUsers()
    },

    // 分页处理
    handleSizeChange(pageSize) {
      this.crudData.pageSize = pageSize
      this.fetchUsers()
    },
    
    handleCurrentChange(currentPage) {
      this.crudData.currentPage = currentPage
      this.fetchUsers()
    },
    
    handleSelectionChange: function(selection) {
      this.crudData.selectedIds = selection.map(item => item.id)
    },
    
    handleBatchDelete: async function() {
      if (this.crudData.selectedIds.length === 0) {
        this.$message.warning('请选择要删除的用户')
        return
      }
      
      this.$confirm(`确定要删除选中${this.crudData.selectedIds.length} 个用户吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const deletePromises = this.crudData.selectedIds.map(id => deleteUser(id))
          await Promise.all(deletePromises)
          this.$message.success('批量删除成功')
          this.crudData.selectedIds = []
          this.fetchUsers()
        } catch (error) {
          this.$message.error('批量删除失败')
          console.error('批量删除失败:', error)
        } finally {
          this.crudData.loading = false
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    addUser: async function() {
      // 重置表单引用
      if (this.$refs.formRef) {
        try {
          this.$refs.formRef.resetFields()
        } catch (error) {
          console.warn('重置表单失败:', error)
        }
      }
      
      // 先加载数据，确保在设置表单前数据已准备好
      await this.loadUserDataForEdit()
      
      this.currentUser = {
        id: null,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        department_id: null,
        roles: [],
        password: '',
        confirm_password: '',
        is_active: true,
        employee_no: '',
        gender: 0,
        user_type: '0',
        post: null,
        name: ''
      }
      this.isEditing = false
      
      // 确保dialogVisible设置为false后再设置为true
      this.dialogVisible = false
      
      // 使用$nextTick确保DOM更新后再显示弹窗
      this.$nextTick(() => {
        this.dialogVisible = true
        
        // 再次使用nextTick确保对话框渲染完成后，设置初始值
        this.$nextTick(() => {
          if (this.$refs.formRef && this.$refs.formRef.setFieldsValue) {
            try {
              this.$refs.formRef.setFieldsValue({
                user_type: '0',
                is_active: true
              })
            } catch (error) {
              console.warn('设置初始表单值失败', error)
            }
          }
        })
      })
    },
    
    editUser: async function(user) {
      // 重置表单引用
      if (this.$refs.formRef) {
        try {
          this.$refs.formRef.resetFields()
        } catch (error) {
          console.warn('重置表单失败:', error)
        }
      }
      
      // 确保user和user.user对象存在
      const safeUser = user || {}
      const safeUserData = safeUser.user || {}
      
      // 设置isEditing标志
      this.isEditing = true
      this.dialogVisible = false
      
      try {
        // 先加载数据，确保部门树已经加载完成
        await this.loadUserDataForEdit()
        
        // 处理角色数据，支持多种数据结构
        let rolesArray = []
        // 检查顶层roles数组
        if (safeUser.roles && Array.isArray(safeUser.roles)) {
          rolesArray = safeUser.roles
        }
        // 检查user对象中的roles数组
        else if (safeUserData.roles && Array.isArray(safeUserData.roles)) {
          rolesArray = safeUserData.roles
        }
        
        // 提取角色ID
        const roleIds = rolesArray
          .filter(role => role && (role.id || role)) // 确保角色有ID
          .map(role => role.id || role) // 处理对象或直接值的情况
        
        // 处理部门ID，支持多种数据结构
        const departmentId = this.getDepartmentId(safeUser)
        
        // 处理职位ID
        let postId = null
        // 检查多种可能的职位数据结构
        if (safeUser.post && safeUser.post.id) {
          postId = safeUser.post.id
        } else if (safeUser.post) {
          postId = safeUser.post // 直接是ID的情况
        } else if (safeUserData.post && safeUserData.post.id) {
          postId = safeUserData.post.id
        } else if (safeUserData.post) {
          postId = safeUserData.post
        }
        
        // 在部门树加载完成后，再设置用户数据
        this.currentUser = {
          id: safeUser.id || null,
          username: safeUserData.username || '',
          first_name: safeUserData.first_name || '',
          last_name: safeUserData.last_name || '',
          email: safeUserData.email || '',
          mobile: safeUser.mobile || safeUserData.mobile || '',
          department_id: departmentId, // 对于cascader，直接使用ID即可
          roles: roleIds,
          employee_no: safeUser.employee_no || '',
          gender: safeUser.gender || 0,
          user_type: String(safeUser.user_type || safeUserData.user_type || '0'),
          post: postId,
          password: '',
          confirm_password: '',
          is_active: safeUserData.is_active || true,
          name: safeUser.name || ''
        }
        
        // 使用$nextTick确保DOM更新后再显示弹窗
        this.$nextTick(() => {
          this.dialogVisible = true
          
          // 再次使用nextTick确保对话框渲染完成后，强制更新表单数据
          this.$nextTick(() => {
            if (this.$refs.formRef && this.$refs.formRef.setFieldsValue) {
              try {
                // 准备要设置的表单值，确保所有字段类型正确
                const formValues = {
                  user_type: String(this.currentUser.user_type),
                  department_id: this.currentUser.department_id,
                  roles: this.currentUser.roles,
                  post: this.currentUser.post
                }
                
                // 立即设置表单
                this.$refs.formRef.setFieldsValue(formValues)
              } catch (error) {
                console.warn('强制更新表单字段失败:', error)
              }
            }
          })
        })
      } catch (error) {
        console.error('加载用户编辑数据失败:', error)
        this.$message.error('加载用户信息失败')
      }
    },
    
    saveUser: async function(formData, callback) {
      try {
        // 构建符合API要求的数据结构，确保department_id是数字类型，需要特别处理cascader组件返回的数据
        let department_id = formData.department_id
        
        // 处理cascader组件返回的数组（包含所选节点的所有祖先节点ID）
        if (Array.isArray(department_id) && department_id.length > 0) {
          // 取数组的最后一个元素作为最终的部门ID
          department_id = department_id[department_id.length - 1]
        }
        
        // 转换为数字类型
        if (department_id !== null && department_id !== undefined) {
          department_id = Number(department_id)
          if (isNaN(department_id)) {
            department_id = null
          }
        }
        
                
        const submitData = {
          // User对象字段需要嵌套在user对象中
          user: {
            username: formData.username,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            is_active: formData.is_active
          },
          // UserProfile字段 - 使用正确的字段名进行写入
          department_id: department_id || null,
          role_ids: formData.roles || [],
          mobile: formData.mobile || null,
          employee_no: formData.employee_no || null,
          name: formData.name || null,
          gender: formData.gender.value,
          user_type: formData.user_type || '0',
          post_id: formData.post || null
        }
        
        // 添加调试信息，检查完整的提交数据
                
        // 添加更多调试信息，检查最终提交数据中的部门ID
                
        // 只有在添加用户时才包含密码字段，编辑用户时不更新密码
        if (this.isEditing) {
          // 编辑用户时，完全不包含密码字段
          await updateUser(formData.id, submitData)
          this.$message.success('用户更新成功')
        } else {
          // 新增用户时密码字段放在user对象中
          submitData.user.password = formData.password
          await createUser(submitData)
          this.$message.success('用户添加成功')
        }
        
        if (callback) callback()
        this.dialogVisible = false
        this.fetchUsers()
      } catch (error) {
        // 处理具体的错误信息，提供更友好的提示
        if (error.response && error.response.data) {
          const errorData = error.response.data
                    
          // 处理用户名重复错误
          if (errorData.user && errorData.user.username && errorData.user.username.includes('already exists')) {
            this.$message.error('用户名已存在，请更换其他用户')
          }
          // 处理部门ID相关错误
          else if (errorData.department_id) {
            this.$message.error(`部门选择有误: ${errorData.department_id}`)
          }
          // 处理其他错误
          else {
            const errorMessage = errorData.detail || (this.isEditing ? '用户更新失败' : '用户添加失败')
            this.$message.error(errorMessage)
          }
        } else {
          this.$message.error(this.isEditing ? '用户更新失败' : '用户添加失败')
        }
        console.error('保存用户失败:', error)
        
        if (callback) callback(error)
      }
    },
    
    deleteUser: async function(user) {
      // 处理传入的参数，可能是用户对象或用户ID
      const userId = user && typeof user === 'object' ? user.id : user
      const username = user && typeof user === 'object' && user.user ? user.user.username : '该用户'
      
      this.$confirm(`确定要删除用户"${username}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteUser(userId)
          this.$message.success('用户删除成功')
          this.fetchUsers()
        } catch (error) {
          this.$message.error('用户删除失败')
          console.error('删除用户失败:', error)
        } finally {
          this.crudData.loading = false
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    resetUserPassword: function(user) {
      this.resetPasswordVisible = true
      // 存储用户ID和用户名（后端需要username）
      this.resetPasswordUserId = user.id
      // 获取用户名，支持多种数据格式
      let username = ''
      if (user.user && user.user.username) {
        username = user.user.username
      } else if (user.username) {
        username = user.username
      } else if (user.user_username) {
        username = user.user_username
      }
      this.resetPasswordUsername = username
      console.log('Reset password for user:', user.id, username)
      this.resetPasswordForm = {
        password: '',
        confirm_password: ''
      }
    },
    
    submitResetPassword: async function(formData, callback) {
      // 校验用户名是否存在
      if (!this.resetPasswordUsername) {
        this.$message.error('无法获取用户名，请刷新页面重试')
        if (callback) callback(new Error('无法获取用户名'))
        return
      }
      
      // 校验密码是否一致
      if (formData.password !== formData.confirm_password) {
        this.$message.error('两次输入的密码不一致')
        if (callback) callback(new Error('密码不一致'))
        return
      }
      
      this.crudData.loading = true
      try {
        // 严格按照后端要求的格式传参：{ username, new_password }
        console.log('Reset password request:', {
          username: this.resetPasswordUsername,
          new_password: formData.password
        })
        await resetUserPassword({
          username: this.resetPasswordUsername,
          new_password: formData.password
        })
        this.$message.success('密码重置成功')
        this.resetPasswordVisible = false
        
        if (callback) callback()
      } catch (error) {
        // 处理具体的错误信息，提供更友好的提示
        console.error('Reset password error:', error)
        if (error.response && error.response.data) {
          const errorMessage = error.response.data.detail || error.response.data.error || '密码重置失败'
          this.$message.error(errorMessage)
        } else {
          this.$message.error('密码重置失败')
        }
        
        if (callback) callback(error)
      } finally {
        this.crudData.loading = false
      }
    }
    

  }
}
</script>

<style scoped>
.user-container {
  padding: 20px;
}
</style>
