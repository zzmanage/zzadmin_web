<template>
  <div>
    <h1>角色管理</h1>
    
    <!-- 查询条件区域 -->
    <SearchForm 
      :form-items="searchFields" 
      :form-data="searchForm"
      @search="handleSearch"
      @reset="resetForm"
      :show-action-buttons="true"
    >
      <template #extra-buttons>
        <el-button type="primary" @click="addRole" style="margin-right: 10px;">添加角色</el-button>
        <ImportExport
          :api-prefix="'/api/role'"
          :export-params="getExportParams"
          :loading="crudData.loading"
          @import-success="handleImportSuccess"
          :template-filename="'角色管理模板.xlsx'"
        />
      </template>
    </SearchForm>

    <!-- 批量操作区域 -->
    <BatchActions
      v-if="selectedRows.length > 0"
      :selected-count="selectedRows.length"
      @clear="clearSelection"
    >
      <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
        批量删除
      </el-button>
    </BatchActions>

    <!-- 角色列表 -->
    <DataTable
      :data="crudData.dataList"
      :columns="tableColumns"
      :loading="crudData.loading"
      :show-empty="true"
      empty-text="暂无角色数据"
      @selection-change="handleSelectionChange"
      :show-actions="true"
      :actions-width="250"
      :actions-fixed="false"
    >
      <!-- 操作列内-->
      <template #actions="{row}">
        <el-button size="small" @click="editRole(row)">编辑</el-button>
        <el-button size="small" type="info" @click="assignPermissions(row)">分配权限</el-button>
        <el-button size="small" type="danger" @click="deleteRole(row.id)">删除</el-button>
      </template>
      <!-- 状态列模板插槽 -->
      <template #column-status="{row}">
        <StatusTag :status="row.status" />
      </template>
    </DataTable>
    
    <!-- 分页控件 -->
    <div style="margin-top: 20px; text-align: right;">
      <el-pagination
        v-model:current-page="crudData.pagination.currentPage"
        v-model:page-size="crudData.pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="crudData.pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 角色信息弹窗 -->
    <DialogForm
      :title="isEditing  ? '编辑角色' : '添加角色'"
      v-model="dialogVisible"
      :form-data="formData"
      :rules="formRules"
      :form-items="formFields"
      @submit="saveRole"
    >
      <!-- 可以在这里添加自定义内容 -->
    </DialogForm>
    
    <!-- 权限弹窗 -->
    <el-dialog
      title="分配权限"
      v-model="permissionDialogVisible"
      width="900px"
      :before-close="handlePermissionDialogClose"
    >
      <div class="permission-container">
        <div class="menu-tree-container">
          <div class="panel-header">权限列表</div>
          <!-- 加载状态 -->
          <div v-if="permissionLoading" class="empty-state">
            <el-skeleton :rows="6" animated />
          </div>
          <!-- 空状态 -->
          <div v-else-if="!permissionTree || !Array.isArray(permissionTree) || permissionTree.length === 0" class="empty-state">
            <el-empty description="暂无权限数据" :image-size="100" />
            <div style="margin-top: 10px; text-align: center; color: #606266;">
              当前角色没有分配任何权限
            </div>
          </div>
          <!-- 正常显示权限-->
          <el-tree
            v-else
            ref="permissionTreeRef"
            :data="permissionTree"
            show-checkbox
            node-key="id"
            :props="permissionTreeProps"
            :expand-on-click-node="false"
            :default-expand-all="true"
            :default-checked-keys="defaultCheckedKeys"
            @check="handleMenuCheck"
          >
            <!-- 自定义节点内容，菜单名称和按钮在同一行显-->
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span>{{ data.name }}</span>
                <!-- 显示菜单绑定的按-->
                <span v-if="data.buttons && Array.isArray(data.buttons) && data.buttons.length > 0" class="button-group">
                  <el-checkbox
                  v-for="(button, index) in data.buttons"
                  :key="button.id + '-' + index"
                  :model-value="getButtonChecked(data.id, button.id)"
                  @click.stop
                  @change="(checked) => handleButtonChange(data.id, button.id, checked)"
                  style="margin-left: 15px; cursor: pointer; margin-right: 5px;"
                >
                  {{ button.name }}
                </el-checkbox>
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
      <template v-slot:footer>
        <div class="permission-dialog-footer">
          <el-button @click="handlePermissionDialogClose">取消</el-button>
          <el-button type="primary" @click="submitPermissions">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getRoleList, createRole, updateRole, deleteRole, getRolePermissionsTree, newUpdateRolePermissions } from '../api/role'
import ImportExport from '../components/ImportExport.vue'
import SearchForm from '../components/SearchForm.vue'
import DataTable from '../components/DataTable.vue'
import DialogForm from '../components/DialogForm.vue'
import BatchActions from '../components/BatchActions.vue'
import StatusTag from '../components/StatusTag.vue'
import { useCRUD } from '../utils/common/crud-helper'
import { formatDate } from '../utils/common/date-utils'

// 格式化数据权限范围显示
const formatDataRange = (row) => {
  const dataRangeMap = {
    0: '仅本人数据权限',
    1: '本部门及以下数据权限',
    2: '本部门数据权限',
    3: '全部数据权限',
    4: '自定数据权限'
  }
  return dataRangeMap[row.data_range] || ''
}

// 格式化日期时间，确保日期能正确解析
const formatDateTime = (row) => {
  try {
    return formatDate(row.updated_at)
  } catch (error) {
    console.error('日期格式化错误', error)
    return row.updated_at || ''
  }
}

export default {
  name: 'Role',
  components: {
    ImportExport,
    SearchForm,
    DataTable,
    DialogForm,
    BatchActions,
    StatusTag
  },
  
  data() {
    // 使用CRUD辅助函数管理数据加载
    const crudData = useCRUD({
      fetchDataApi: getRoleList,
      defaultParams: {
        page: 1,
        pageSize: 10
      },
      autoLoad: false,
      enablePagination: true
    })
    
    return {
      crudData,
      // 已选择的行数据
      selectedRows: [],
      searchForm: {
        name: '',
        status: ''
      },
      dialogVisible: false,
      isEditing: false,
      formData: {
        id: null,
        name: '',
        key: '',
        description: '',
        sort: 1,
        status: true,
        data_range: 0
      },
      // 权限相关数据
      permissionDialogVisible: false,
      permissionLoading: false,
      permissionTree: [],
      permissionTreeProps: {
        children: 'children',
        label: 'name',
        id: 'id'
      },
      defaultCheckedKeys: [],
      currentRoleId: null,
      
      // 独立的按钮选中状态存储（格式：{ menuId: { buttonId: checked } }）
      buttonCheckedMap: {},
      
      // 搜索表单配置
      searchFields: [
        { label: '角色名称', prop: 'name', type: 'input' },
        {
          label: '角色状态',
          prop: 'status',
          type: 'select',
          width: '80px',
          options: [
            { label: '全部', value: '' },
            { label: '启用', value: true },
            { label: '禁用', value: false }
          ]
        }
      ],
      // 表格列配置
      tableColumns: [
        {
          type: 'selection',
          width: 55
        },
        { prop: 'id', label: '角色ID', minWidth: 80 },
        { prop: 'name', label: '角色名称', minWidth: 150 },
        {
          prop: 'status',
          label: '角色状态',
          minWidth: 80,
          template: true
        },
        { prop: 'sort', label: '排序', minWidth: 80 },
        {
          prop: 'data_range',
          label: '数据权限范围',
          minWidth: 150,
          tag: true,
          tagType: (row) => {
            const typeMap = {
              0: 'default',
              1: 'success',
              2: 'info',
              3: 'primary',
              4: 'warning'
            }
            return typeMap[row.data_range] || 'default'
          },
          formatter: formatDataRange
        },
        {
          prop: 'updated_at',
          label: '更新时间',
          minWidth: 180,
          formatter: formatDateTime
        }
      ],
      // 表单字段配置
      formFields: [
        {
          label: '角色名称',
          prop: 'name',
          type: 'input',
          required: true,
          placeholder: '请输入角色名'
        },
        {
          label: '权限字符',
          prop: 'key',
          type: 'input',
          required: true,
          placeholder: '请输入权限字符'
        },
        {
          label: '角色描述',
          prop: 'description',
          type: 'textarea',
          placeholder: '请输入角色描述',
          rows: 3
        },
        {
          label: '角色排序',
          prop: 'sort',
          type: 'number',
          required: true,
          min: 1,
          max: 999,
          placeholder: '请输入排序号'
        },
        {
          label: '角色状态',
          prop: 'status',
          type: 'switch',
          activeText: '启用',
          inactiveText: '禁用'
        },
        {
          label: '数据权限范围',
          prop: 'data_range',
          type: 'select',
          valueType: 'number',
          required: true,
          placeholder: '请选择数据权限范围',
          options: [
            { label: '仅本人数据权限', value: 0 },
            { label: '本部门及以下数据权限', value: 1 },
            { label: '本部门数据权限', value: 2 },
            { label: '全部数据权限', value: 3 },
            { label: '自定数据权限', value: 4 }
          ]
        }
      ],
      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入角色名', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        key: [
          { required: true, message: '请输入权限字符', trigger: 'blur' },
          { min: 1, max: 64, message: '长度在 1 到 64 个字符', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '请输入排序号', trigger: 'blur' },
          { type: 'number', min: 1, max: 999, message: '排序号在 1 999 之间', trigger: 'blur' }
        ],
        data_range: [
          { required: true, message: '请选择数据权限范围', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.fetchRoles()
  },
  computed: {
    // 导出参数配置
    getExportParams() {
      return {
        page: this.crudData.pagination.currentPage,
        pageSize: this.crudData.pagination.pageSize,
        name: this.searchForm.name,
        status: this.searchForm.status
      }
    }
  },
  methods: {
    // 获取角色列表
    async fetchRoles() {
      try {
        const params = {
          page: this.crudData.pagination.currentPage,
          pageSize: this.crudData.pagination.pageSize,
          name: this.searchForm.name,
          status: this.searchForm.status
        }
        
        await this.crudData.fetchData(params)
      } catch (error) {
        console.error('获取角色列表失败:', error)
        this.$message.error('获取角色列表失败')
      }
    },
    
    // 处理搜索
    async handleSearch() {
      this.crudData.pagination.currentPage = 1
      await this.fetchRoles()
    },
    
    // 重置搜索表单
    resetForm() {
      this.searchForm = {
        name: '',
        status: ''
      }
      this.crudData.pagination.currentPage = 1
      this.fetchRoles()
    },
    
    // 分页大小改变
    handleSizeChange(pageSize) {
      this.crudData.pagination.pageSize = pageSize
      this.fetchRoles()
    },
    
    // 当前页码改变
    handleCurrentChange(currentPage) {
      this.crudData.pagination.currentPage = currentPage
      this.fetchRoles()
    },
    
    // 选择项变化时触发
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    
    // 清空选择
    clearSelection() {
      this.selectedRows = []
    },
    
    // 批量删除角色
    async handleBatchDelete() {
      try {
        await this.$confirm(`确定要删除选中${this.selectedRows.length}个角色吗`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const ids = this.selectedRows.map(row => row.id)
        // 循环删除每个角色
        for (const id of ids) {
          await deleteRole(id)
        }
        
        this.$message.success('批量删除成功')
        this.clearSelection()
        this.fetchRoles()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('批量删除失败')
          console.error('批量删除失败:', error)
        } else {
          this.$message.info('已取消删除')
        }
      }
    },
    
    // 处理行操作（保持兼容旧的调用方式）
    handleRowAction({ action, row }) {
      switch (action) {
      case  'edit' :
        this.editRole(row)
        break
      case  'delete' :
        this.deleteRole(row.id)
        break
      }
    },
    
    // 添加角色
    addRole() {
      this.isEditing = false
      this.formData = {
        id: null,
        name: '',
        key: '',
        description: '',
        sort: 1,
        status: true,
        data_range: 0
      }
      this.dialogVisible = true
    },
    
    // 编辑角色
    editRole(row) {
      this.isEditing = true
      // 确保data_range是数字类型
      this.formData = {
        ...row,
        data_range: Number(row.data_range) // 显式转换为数字
      }
      this.dialogVisible = true
    },
    
    // 保存角色信息
    async saveRole() {
      try {
        // 更新或创建角色时确保提供permission_ids字段，即使是空数组也要提供
        const roleData = {
          ...this.formData,
          permission_ids: [] // 默认为空数组
        }
        
        if (this.isEditing) {
          await updateRole(this.formData.id, roleData)
          this.$message.success('角色更新成功')
        } else {
          await createRole(roleData)
          this.$message.success('角色添加成功')
        }
        
        this.dialogVisible = false
        this.fetchRoles()
      } catch (error) {
        console.error('提交角色信息失败:', error)
        this.$message.error(this.isEditing ? '角色更新失败' : '角色添加失败')
      }
    },
    
    // 删除角色
    async deleteRole(id) {
      this.$confirm('确定要删除这个角色吗', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteRole(id)
          this.$message.success('角色删除成功')
          this.fetchRoles()
        } catch (error) {
          this.$message.error('角色删除失败')
          console.error('删除角色失败:', error)
        }
        }).catch(() => {
          this.$message.info('已取消删除')
        })
    },
    
    // 处理导入成功事件
    handleImportSuccess() {
      this.$message.success('角色数据导入成功')
      // 重新加载角色列表
      this.fetchRoles()
    },
    
    // 分配权限按钮点击事件
    async assignPermissions(row) {
      this.currentRoleId = row.id
      this.permissionDialogVisible = true
      await this.loadPermissionTree()
    },
    
    // 加载权限树数据
    async loadPermissionTree() {
      this.permissionLoading = true
      // 清空之前的按钮状态
      this.buttonCheckedMap = {}
      try {
        const result = await getRolePermissionsTree(this.currentRoleId)
        
        // 先赋值权限树
        this.permissionTree = result
        
        // 处理权限树数据（初始化按钮状态）
        this.processPermissionTree(result)
        
        // 设置默认选中的keys（基于处理后的数据）
        this.setDefaultCheckedKeys()
        
      } catch (error) {
          console.error('加载权限树失败', error)
          this.$message.error('加载权限树失败')
          this.permissionTree = []
          this.defaultCheckedKeys = []
      } finally {
        this.permissionLoading = false
      }
    },
    
    // 处理权限树数- 初始化按钮状态到独立存储
    processPermissionTree(tree) {
      if (!Array.isArray(tree)) return
      
      tree.forEach(node => {
        // 初始化按钮的选中状态到独立存储
        if (node.buttons && Array.isArray(node.buttons) && node.buttons.length > 0) {
          if (!this.buttonCheckedMap[node.id]) {
            this.buttonCheckedMap[node.id] = {}
          }
          node.buttons.forEach(button => {
            if (button) {
              // Vue 3中直接赋值即可响应式
              this.buttonCheckedMap[node.id][button.id] = button.checked || false
            }
          })
        }
        
        // 递归处理子节点
        if (node.children && Array.isArray(node.children)) {
          this.processPermissionTree(node.children)
        }
      })
    },
    
    // 设置默认选中的keys
    setDefaultCheckedKeys() {
      const checkedKeys = new Set()
      
      const collectCheckedKeys = (nodes) => {
        if (!Array.isArray(nodes)) return
        
        nodes.forEach(node => {
          // 只收集菜单节点的ID，不收集按钮的ID
          // 检查该菜单下是否有选中的按钮（从独立存储中获取）
          if (node.buttons && Array.isArray(node.buttons)) {
            const hasCheckedButton = node.buttons.some(button => {
              if (!button) return false
              return this.buttonCheckedMap[node.id] && this.buttonCheckedMap[node.id][button.id]
            })
            if (hasCheckedButton) {
              checkedKeys.add(node.id)
            }
          }
          
          // 递归处理子节点
          if (node.children && Array.isArray(node.children)) {
            collectCheckedKeys(node.children)
          }
        })
      }
      
      collectCheckedKeys(this.permissionTree)
      this.defaultCheckedKeys = Array.from(checkedKeys)
    },
    
    
    
    // ============ 菜单选中事件：更新按钮状态============
    handleMenuCheck(data, checkedStatus) {
      const { checkedKeys } = checkedStatus
      const isMenuChecked = checkedKeys.includes(data.id)
      
      // 更新该菜单及其所有子菜单下的按钮选中状态
      this.updateMenuAndChildrenButtons(data, isMenuChecked)
    },
    
    // 递归更新菜单及其所有子菜单下的按钮选中状态（使用独立状态存储）
    updateMenuAndChildrenButtons(menu, isChecked) {
      // 更新当前菜单下的按钮状态
      if (menu.buttons && Array.isArray(menu.buttons)) {
        if (!this.buttonCheckedMap[menu.id]) {
          this.buttonCheckedMap[menu.id] = {}
        }
        menu.buttons.forEach(button => {
          if (button) {
            this.buttonCheckedMap[menu.id][button.id] = isChecked
          }
        })
      }
      
      // 递归更新子菜单的按钮状态
      if (menu.children && Array.isArray(menu.children)) {
        menu.children.forEach(child => {
          this.updateMenuAndChildrenButtons(child, isChecked)
        })
      }
    },
    
    // ============ 获取按钮选中状态============
    getButtonChecked(menuId, buttonId) {
      if (!this.buttonCheckedMap[menuId]) {
        return false
      }
      return this.buttonCheckedMap[menuId][buttonId] || false
    },
    
    // ============ 按钮状态变化事件============
    handleButtonChange(menuId, buttonId, checked) {
      // 更新按钮状态
      if (!this.buttonCheckedMap[menuId]) {
        this.buttonCheckedMap[menuId] = {}
      }
      this.buttonCheckedMap[menuId][buttonId] = checked
      
      // 更新菜单选中状态
      this.updateMenuCheckState(menuId)
    },
    
    // ============ 更新菜单选中状态============
    updateMenuCheckState(menuId) {
      const treeRef = this.$refs.permissionTreeRef
      if (!treeRef) return
      
      // 查找该菜单节点
      const findNode = (nodes) => {
        for (const node of nodes) {
          if (node.id === menuId) return node
          if (node.children && Array.isArray(node.children)) {
            const found = findNode(node.children)
            if (found) return found
          }
        }
        return null
      }
      
      const node = findNode(this.permissionTree)
      if (!node || !node.buttons || !Array.isArray(node.buttons)) return
      
      // 检查按钮选中情况
      const totalButtons = node.buttons.length
      let checkedButtons = 0
      
      node.buttons.forEach(button => {
        if (button && this.buttonCheckedMap[menuId] && this.buttonCheckedMap[menuId][button.id]) {
          checkedButtons++
        }
      })
      
      // 简化逻辑：只要有按钮被选中，菜单就选中
      if (checkedButtons === 0) {
        // 没有按钮选中 取消菜单选中
        treeRef.setChecked(menuId, false)
      } else {
        // 有按钮被选中（不管是部分还是全部）→ 选中菜单
        treeRef.setChecked(menuId, true)
      }
    },
    
    // ============ 获取所有选中的权限ID和按钮ID ============
    getAllCheckedKeys() {
      const menuIds = []
      const buttonIds = []
      
      // 从el-tree获取选中的菜单ID
      const treeRef = this.$refs.permissionTreeRef
      if (treeRef) {
        menuIds.push(...treeRef.getCheckedKeys())
      }
      
      // 从独立状态存储获取选中的按钮ID
      for (const menuId in this.buttonCheckedMap) {
        const buttonMap = this.buttonCheckedMap[menuId]
        for (const buttonId in buttonMap) {
          if (buttonMap[buttonId]) {
            buttonIds.push(Number(buttonId))
          }
        }
      }
      
      return { menuIds, buttonIds }
    },
    
    // 提交权限分配
    async submitPermissions() {
      try {
        // 获取所有选中的权限ID和按钮ID
        const { menuIds, buttonIds } = this.getAllCheckedKeys()
        // 调用API更新角色权限（传递正确的参数格式）
        await newUpdateRolePermissions(this.currentRoleId, menuIds, buttonIds)
        this.$message.success('权限分配成功')
        this.handlePermissionDialogClose()
      } catch (error) {
        console.error('权限分配失败:', error)
        this.$message.error('权限分配失败')
      }
    },
    
    // 权限弹窗关闭事件
    handlePermissionDialogClose() {
      // 清空防抖定时器
      if (this.updateTimer) {
        clearTimeout(this.updateTimer)
        this.updateTimer = null
      }
      
      this.permissionDialogVisible = false
      this.permissionTree = []
      this.defaultCheckedKeys = []
      this.currentRoleId = null
      this.operationSource = null
      this.processingMenuId = null
      // 清空按钮状态存储
      this.buttonCheckedMap = {}
      
      // 清除el-tree的引用
      this.$nextTick(() => {
        if (this.$refs.permissionTreeRef) {
          this.$refs.permissionTreeRef = null
        }
      })
    }
  }
}
</script>

<style scoped>
.el-dialog--large {
  width: 80%;
}

.role-form {
  margin-top: 20px;
}

.role-form-item {
  margin-bottom: 20px;
}

/* 权限容器样式 */
.permission-container {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  display: flex;
  height: 400px;
}

/* 左侧菜单树容器样*/
.menu-tree-container {
  width: 100%;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

/* 面板头部样式 */
.panel-header {
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: 500;
  font-size: 14px;
  color: #303133;
}

/* 空状态样*/
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}

/* 确保树组件正确显*/
:deep(.el-tree) {
  flex: 1;
  padding: 15px;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 5px 0;
}

/* 优化树节点的hover效果 */
:deep(.el-tree-node__content:hover) {
  background-color: #f0f9ff;
}

/* 按钮组样*/
.button-group {
  margin-left: 10px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 弹窗底部按钮样式 - 权限弹窗 */
.permission-dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px 10px;
}

.permission-dialog-footer .el-button {
  margin-left: 10px;
}
</style>