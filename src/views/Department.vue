<template>
  <div>
    <h1>部门管理</h1>
    
    <!-- 查询条件区域 -->
    <SearchForm 
      :form-items="searchFields" 
      :form-data="searchForm"
      @search="handleSearch"
      @reset="resetForm"
      :show-action-buttons="true"
    >
      <template #extra-buttons>
          <el-button type="primary" @click="addDepartment" style="margin-right: 10px;">添加部门</el-button>
        </template>
    </SearchForm>
    

    <!-- 部门管理表格 -->
    <div class="table-container">
      <!-- 全部展开/收起按钮已隐-->
      <!-- <div class="header-actions">
        <el-button @click="expandAll">全部展开</el-button>
        <el-button @click="collapseAll">全部收起</el-button>
      </div> -->
      
      <TreeTable
        ref="treeTable"
        :data="departmentsTree"
        :columns="tableColumns"
        :loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :indent-width="20"
        border
        :default-expand-all="false"

        @row-action="handleRowAction"
        @expand-change="handleExpandChange"
      >
        <template #column-status="{ row }">
          <StatusTag :status="row.status" />
        </template>
        <template #column-updated_at="{ row }">
          {{ formatDate(row.updated_at) }}
        </template>

      </TreeTable>
    </div>
    
    <!-- 部门总数信息 -->
    <div style="margin-top: 20px; text-align: right; color: #606266;">
      {{ departmentsFlat.length }} 个部    </div>

    <!-- 添加/编辑部门弹窗 -->
    <DialogForm
      ref="dialogForm"
      :title="isEditing  ? '编辑部门' : '添加部门'"
      v-model="dialogVisible"
      :form-data="formData"
      :rules="formRules"
      :form-items="formFields"
      @submit="saveDepartment"
      width="500px"
    />
  </div>
</template>

<script>
import { getDeptTree, createDept, updateDept, deleteDept } from '../api/dept'
import ImportExport from '../components/ImportExport.vue'
import SearchForm from '../components/SearchForm.vue'
import TreeTable from '../components/TreeTable.vue'
import DialogForm from '../components/DialogForm.vue'
import StatusTag from '../components/StatusTag.vue'
import { useCRUD } from '../utils/common/crud-helper'
import { formatDate as dateFormat } from '../utils/common/date-utils'

export default {
  name: 'Department',
  components: {
    ImportExport,
    SearchForm,
    TreeTable,
    DialogForm,
    StatusTag
  },
  data() {
    // 使用CRUD辅助函数管理数据加载
    const crudData = useCRUD({
      fetchDataApi: getDeptTree,
      defaultParams: {},
      autoLoad: false
    })
    
    return {
      crudData,
      searchForm: {
        name: '',
        status: ''
      },
      searchParams: {},
      dialogVisible: false,
      isEditing: false,
      departmentsFlat: [],
      loading: false,
      departmentsTree: [],
      // 新增一个变量专门存储级联选择器的选项
      deptTreeOptions: [],
      
      formData: {
        id: null,
        name: '',
        parent: null,
        description: '',
        key: '',
        sort: 1,
        owner: '',
        mobile: '',
        email: '',
        status: true
      },
      // 搜索表单配置
      searchFields: [
        { label: '部门名称', prop: 'name', type: 'input' },
        {
          label: '状态',
          prop: 'status',
          type: 'select',
          options: [
            { label: '全部', value: '' },
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 }
          ]
        }
      ],
      // 表格列配置
      tableColumns: [
        {
          prop: 'name',
          label: '部门名称',
          width: 250,
          isTreeColumn: true
        },
        {
          prop: 'owner',
          label: '负责人',
          width: 120
        },
        {
          prop: 'sort',
          label: '排序',
          width: 80,
          align: 'center'
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          align: 'center',
          template: true
        },
        {
          prop: 'updated_at',
          label: '更新时间',
          width: 180,
          template: true
        },
        {
          label: '操作',
          width: 180,
          fixed: 'right',
          align: 'center',
          actions: [
            { text: '编辑', action: 'edit', size: 'small' },
            { text: '删除', action: 'delete', type: 'danger', size: 'small' }
          ]
        }
      ],
      // 表单字段配置
      formFields: [
        {
          label: '部门名称',
          prop: 'name',
          type: 'input',
          required: true,
          placeholder: '请输入部门名称'
        },
        {
          prop: 'parent',
          label: '上级部门',
          type: 'cascader',
          options: [],
          props: {
            checkStrictly: true,
            emitPath: true,
            multiple: false,
            clearable: true,
            lazy: false,
            // 明确指定字段名称
            value: 'id',
            label: 'name',
            children: 'children',
            // 确保选择器能正确处理对象格式的值
            valueFormat: 'array'
          },
          placeholder: '请选择上级部门',
          onChange: this.handleCascaderChange,
          // 添加直接设置值的方法
          setValue: (value) => {
            // 确保值是数组格式
            return Array.isArray(value) ? value : value ? [value] : null
          }
        },
        {
          label: '部门描述',
          prop: 'description',
          type: 'textarea',
          placeholder: '请输入部门描述'
        },
        {
          label: '关联字符',
          prop: 'key',
          type: 'input',
          placeholder: '请输入关联字符'
        },
        {
          label: '显示排序',
          prop: 'sort',
          type: 'number',
          required: true,
          min: 1,
          placeholder: '请输入显示排序'
        },
        {
          label: '负责人',
          prop: 'owner',
          type: 'input',
          placeholder: '请输入负责人姓名'
        },
        {
          label: '联系电话',
          prop: 'mobile',
          type: 'input',
          placeholder: '请输入联系电话'
        },
        {
          label: '邮箱',
          prop: 'email',
          type: 'input',
          placeholder: '请输入邮箱'
        },
        {
          label: '部门状态',
          prop: 'status',
          type: 'switch'
        }
      ],
      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入部门名称', trigger: 'blur' },
          { min: 1, max: 100, message: '长度1-100 个字符', trigger: 'blur' }
        ],
        key: [
          { min: 1, max: 32, message: '长度1-32 个字符', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '请输入显示排序', trigger: 'blur' },
          { type: 'number', min: 1, message: '排序必须为正整数', trigger: 'blur' }
        ],
        owner: [
          { min: 1, max: 32, message: '长度1-32 个字符', trigger: 'blur' }
        ],
        mobile: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchDepartments()
  },
  methods: {
    // 获取部门
    async fetchDepartments() {
      try {
        this.loading = true
        
        // 直接调用API获取部门树数据
        const response = await getDeptTree()
        
        // 简化数据格式处理
        let departments = this.processResponseData(response)
        
        // 标准化部门节点数据
        departments = this.normalizeDepartmentNodes(departments)
        
        // 应用搜索过滤（使用单一函数提高性能）
        departments = this.applyTreeFilters(departments)
        
        // 同时更新所有相关数据（减少重复操作）
        this.updateDepartmentData(departments)
        
        // 返回部门树数据，用于loadOptions
        return departments
      } catch (error) {
        // 改进的错误处理
        this.handleApiError(error, '获取部门列表')
        return []
      } finally {
        this.loading = false
      }
    },
    
    // 处理API响应数据格式
    processResponseData(response) {
      if (response && response.code === 200 && response.data) {
        return Array.isArray(response.data) ? response.data : []
      } else if (Array.isArray(response)) {
        return response
      }
      return []
    },
    
    // 标准化部门节点数据
    normalizeDepartmentNodes(nodes) {
      return nodes.map(node => ({
        ...node,
        // 确保负责人字段存在，如果不存在则显示空字符串
        owner: node.owner || node.director || node.manager || '',
        // 确保更新时间字段存在，如果不存在则显示创建时间或空字符串
        updated_at: node.updated_at || node.update_time || node.updated || node.created_at || '',
        children: node.children || [],
        hasChildren: node.children && node.children.length > 0
      }))
    },
    
    // 应用所有树过滤条件（性能优化版本）
    applyTreeFilters(nodes) {
      // 如果没有搜索条件，直接返回原数组
      if (!this.searchForm.name && this.searchForm.status === '') {
        return nodes
      }
      
      let filteredNodes = [...nodes]
      
      // 过滤名称
      if (this.searchForm.name) {
        const searchName = this.searchForm.name.toLowerCase()
        filteredNodes = this.filterTreeByName(filteredNodes, searchName)
      }
      
      // 过滤状态
      if (this.searchForm.status !== '') {
        filteredNodes = this.filterTreeByStatus(filteredNodes, parseInt(this.searchForm.status))
      }
      
      return filteredNodes
    },
    
    // 更新部门相关数据
    updateDepartmentData(departments) {
      this.departmentsTree = departments
      this.formFields[1].options = departments
      this.departmentsFlat = this.flattenTree(departments)
    },
    
    // 处理API错误
    handleApiError(error, operation) {
      console.error(`${operation}失败:`, error)
      this.$message.error(`${operation}失败: ${error.message || '未知错误'}`)
      // 确保在错误情况下也设置空数组
      this.updateDepartmentData([])
    },
    
    // 根据名称过滤树节点
    filterTreeByName(nodes, searchName) {
      const filteredNodes = []
      
      nodes.forEach(node => {
        // 如果当前节点匹配搜索条件，直接添加
        if (node.name.toLowerCase().includes(searchName)) {
          filteredNodes.push({ ...node })
        } else if (node.children && node.children.length > 0) {
          // 否则递归过滤子节点
          const filteredChildren = this.filterTreeByName(node.children, searchName)
          if (filteredChildren.length > 0) {
            // 如果子节点有匹配的，添加当前节点并保留匹配的子节点
            filteredNodes.push({
              ...node,
              children: filteredChildren
            })
          }
        }
      })
      
      return filteredNodes
    },
    
    // 根据状态过滤树结构
    filterTreeByStatus(nodes, status) {
      const filteredNodes = []
      
      nodes.forEach(node => {
        // 检查当前节点状态
        const nodeMatches = node.status === status
        
        // 递归检查子节点
        let filteredChildren = []
        if (node.children && node.children.length > 0) {
          filteredChildren = this.filterTreeByStatus(node.children, status)
        }
        
        // 如果当前节点匹配，或者子节点有匹配的，就添加当前节点
        if (nodeMatches || filteredChildren.length > 0) {
          filteredNodes.push({
            ...node,
            children: filteredChildren
          })
        }
      })
      
      return filteredNodes
    },
    
    // 将树结构扁平化
    flattenTree(nodes, result = []) {
      nodes.forEach(node => {
        // 创建一个不包含children的副本
        const { children, ...nodeWithoutChildren } = node
        result.push(nodeWithoutChildren)
        
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          this.flattenTree(node.children, result)
        }
      })
      return result
    },
    
    // 搜索部门
    async handleSearch() {
      this.searchParams = { ...this.searchForm }
      this.crudData.currentPage = 1
      await this.fetchDepartments()
    },
    
    // 重置搜索表单
    resetForm() {
      this.searchForm = {
        name: '',
        status: ''
      }
      this.searchParams = {}
      this.crudData.currentPage = 1
      this.fetchDepartments()
    },
    
    // 处理行操作
    handleRowAction({ action, row }) {
      if (action === 'edit') {
        this.editDepartment(row)
      } else if (action === 'delete') {
        this.deleteDepartment(row.id)
      }
    },
    
    // 处理节点展开/收起事件
    handleExpandChange(row, expanded) {
          },
    
    // 展开所有节点
    expandAll() {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.expandAll()
      }
    },
    
    // 收起所有节点
    collapseAll() {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.collapseAll()
      }
    },
    
    // 添加部门
    addDepartment() {
      this.isEditing = false
      this.formData = {
        id: null,
        name: '',
        parent: null,
        description: '',
        key: '',
        sort: 1,
        owner: '',
        mobile: '',
        email: '',
        status: true
      }
      this.dialogVisible = true
    },
    
    // 构建完整的父级路径数据
    buildParentPath(deptId, tree = null) {
      const path = []
      const deptTree = tree || this.departmentsTree
      
      // 辅助递归函数
      function findPath(nodes, targetId) {
        for (const node of nodes) {
          if (node.id === targetId) {
            // 找到目标节点，开始回溯路径
            return true
          } else if (node.children && node.children.length > 0) {
            // 递归搜索子节点
            if (findPath(node.children, targetId)) {
              // 如果在子节点中找到，将当前节点ID添加到路径前
              path.unshift(node.id)
              return true
            }
          }
        }
        return false
      }
      
      // 查找路径
      if (deptId && findPath(deptTree, deptId)) {
                return path
      }
      
            return null
    },
    
    // 获取部门的直接父级ID
    getDirectParentId(row) {
      // 检查多种可能的父级ID字段
      if (row.parent && typeof row.parent === 'object' && row.parent.id) {
        return row.parent.id
      } else if (row.parent_id !== undefined && row.parent_id !== null && row.parent_id !== '') {
        return row.parent_id
      } else if (row.pid !== undefined && row.pid !== null && row.pid !== '') {
        return row.pid
      } else if (row.parent !== undefined && row.parent !== null && row.parent !== '') {
        const numParent = Number(row.parent)
        if (!isNaN(numParent)) {
          return numParent
        }
      }
      return null
    },
    
    // 编辑部门
    async editDepartment(row) {
      try {
        // 确保组件引用已初始化
        this.isEditing = true
        
        // 立即获取最新的部门树数据
        await this.fetchDepartments()
        
        // 深拷贝行数据
        const rowData = JSON.parse(JSON.stringify(row))
        
        // 打印详细的调试信息
                        
        // 获取直接父级ID
        const directParentId = this.getDirectParentId(rowData)
                
        // 关键改进：构建完整的父级路径数组，而不仅仅是直接父级ID
        let parentPath = null
        if (directParentId) {
          // 为直接父级构建完整路径
          parentPath = this.buildParentPath(directParentId)
          // 如果找到了路径，添加直接父级ID到路径末尾
          if (parentPath) {
            parentPath.push(directParentId)
          } else {
            // 如果无法构建完整路径，至少使用直接父级ID
            parentPath = [directParentId]
          }
        }
        
                
        // 确保级联选择器选项已设置
        this.formFields[1].options = JSON.parse(JSON.stringify(this.departmentsTree))
        
        // 创建表单数据
        const formData = {
          ...rowData,
          // 使用完整的父级路径数据
          parent: parentPath
        }
        
        // 重置formData
        this.formData = {
          id: null,
          name: '',
          parent: null,
          description: '',
          key: '',
          sort: 1,
          owner: '',
          mobile: '',
          email: '',
          status: true
        }
        
        // 重要：先设置表单数据，再打开弹窗
        Object.assign(this.formData, formData)
        
        // 打开弹窗
        this.dialogVisible = true
        
        // 使用Vue的nextTick确保DOM更新
        this.$nextTick(() => {
          // 使用setTimeout确保弹窗完全渲染
          setTimeout(() => {
            // 再次确保级联选择器选项已设置
            this.formFields[1].options = JSON.parse(JSON.stringify(this.departmentsTree))
            
            // 再次设置parent值，强制更新
            if (parentPath) {
              this.formData.parent = [...parentPath]
                          }
            
            // 强制更新组件
            this.$forceUpdate()
            
            // 多次强制更新确保渲染完成
            setTimeout(() => {
              this.$forceUpdate()
                                        }, 200)
          }, 200)
        })
      } catch (error) {
        console.error('编辑部门失败:', error)
        this.$message.error('编辑部门失败')
      }
    },
    
    // 级联选择器变化处理函数
    handleCascaderChange(value, selectedOptions) {
      // 确保formData.parent与选择器值同步
      this.formData.parent = value
    },
    
    // 设置表单的父级路径-简化实现
    setFormParentPath(row) {
      // 直接设置父ID为数组格式，确保级联选择器能正确显示
      let parentId = null
      
      // 多种情况处理父级ID
      if (row.parent && typeof row.parent === 'object' && row.parent.id) {
        parentId = row.parent.id
      } else if (row.parent_id) {
        parentId = row.parent_id
      } else if (row.parent !== null && row.parent !== undefined) {
        parentId = Number(row.parent)
      }
      
      // 确保级联选择器能正确显示的关键：使用数组格式
      this.formData.parent = parentId ? [parentId] : null
    },
    
    // 保存部门信息
    async saveDepartment() {
      try {
        // 处理级联选择器的数据
        const submitData = { ...this.formData }
        
        // 对于新增或编辑部门，父级字段需要保持为单一ID
        if (Array.isArray(submitData.parent)) {
          // 取最后一个元素作为直接父级ID
          submitData.parent = submitData.parent[submitData.parent.length - 1]
        }
        
        if (this.isEditing) {
          // 编辑部门
          await updateDept(submitData.id, submitData)
          this.$message.success('部门更新成功')
        } else {
          // 添加部门
          await createDept(submitData)
          this.$message.success('部门添加成功')
        }
        
        this.dialogVisible = false
        this.fetchDepartments()
      } catch (error) {
        console.error('提交部门信息失败:', error)
        this.$message.error(this.isEditing ? '部门更新失败' : '部门添加失败')
      }
    },
    
    // 删除部门
    async deleteDepartment(id) {
      this.$confirm('确定要删除这个部门吗？删除后其下所有子部门也将被删除', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteDept(id)
          this.$message.success('部门删除成功')
          this.fetchDepartments()
        } catch (error) {
          this.$message.error('部门删除失败')
          console.error('删除部门失败:', error)
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    

    
    // 格式化日期
    formatDate(date) {
      return dateFormat(date)
    },
    
    // 导入成功处理
    handleImportSuccess(response, file) {
            this.$message.success('部门导入成功')
      this.fetchDepartments()
    },
    
    // 导入失败处理
    handleImportError(error, file) {
      console.error('导入失败:', error)
      this.$message.error('部门导入失败')
    }
  }
}
</script>

<style scoped>
.sub-department-item {
  margin-bottom: 8px;
}

.sub-department-content {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}

.sub-department-id {
  width: 80px;
  margin-right: 10px;
  color: #606266;
}

.sub-department-name {
  flex: 1;
  font-weight: 500;
  margin-right: 10px;
}

.sub-department-owner {
  width: 100px;
  margin-right: 10px;
  color: #606266;
}

.sub-department-status {
  width: 80px;
  margin-right: 10px;
}

.sub-department-actions {
  display: flex;
  gap: 8px;
}

.sort-container {
  display: flex;
  align-items: center;
}

.sort-buttons {
  margin-left: 8px;
}
</style>
