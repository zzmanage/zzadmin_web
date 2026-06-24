<template>
  <div>
    <h1>按钮管理</h1>

    <!-- 查询条件区域 -->
    <!-- 使用SearchForm公共组件 -->
    <SearchForm 
      :form-items="searchFields" 
      :form-data="searchForm" 
      @search="handleSearch" 
      @reset="handleReset" 
      :show-action-buttons="true"
    >
      <template #extra-buttons>
        <el-button type="primary" @click="openAddDialog" style="margin-right: 10px;">添加按钮</el-button>
        <el-button type="warning" @click="handleRefreshCache">刷新缓存</el-button>
      </template>
    </SearchForm>
    

    
    <!-- 批量操作按钮区域 -->
    <div class="action-buttons-container" style="margin-bottom: 15px;">
      <BatchActions
        v-if="selectedItems.length > 0"
        :selected-count="selectedItems.length"
        :batch-buttons="batchActions"
        @clear-selection="handleClearSelection"
        @batch-action="handleBatchAction"
      />
    </div>
    
    <!-- 使用DataTable公共组件 -->
    <DataTable 
      ref="dataTable"
      :data="crudData.dataList" 
      :columns="tableColumns" 
      :loading="crudData.loading" 
      :show-selection="true"
      :show-actions="false"
      @selection-change="handleSelectionChange"
      @row-action="handleRowAction"
      :show-empty="true"
      empty-text="暂无按钮数据"
    />
    
    <!-- 使用Pagination公共组件 -->
    <Pagination 
      :current-page="crudData.currentPage"
      :page-size="crudData.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="crudData.total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
    
    <!-- 使用DialogForm公共组件 - 详情弹窗 -->
    <DialogForm 
      v-model="detailDialogVisible" 
      title="按钮详情" 
      width="600px" 
      :form-data="detailForm"
      :form-items="detailFields"
      :show-buttons="false"
      :mode="'detail'"
    >
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </DialogForm>
    
    <!-- 使用DialogForm公共组件 - 添加弹窗 -->
    <DialogForm 
      v-model="addDialogVisible" 
      title="新增按钮" 
      width="500px" 
      :form-data="formData"
      :form-items="formFields"
      :rules="formRules"
      @submit="handleAdd"
    />
    
    <!-- 使用DialogForm公共组件 - 编辑弹窗 -->
    <DialogForm 
      v-model="editDialogVisible" 
      title="编辑按钮" 
      width="500px" 
      :form-data="formData"
      :form-items="formFields"
      :rules="formRules"
      @submit="handleEdit"
    />
  </div>
</template>

<script>
import { getButtonList, createButton, updateButton, deleteButton, refreshButtonCache } from '../api/button'
import { formatDate } from '../utils/common/date-utils'
import { useCRUD, validateForm } from '../utils/common/crud-helper'

// 导入公共组件
import SearchForm from '../components/SearchForm.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import DialogForm from '../components/DialogForm.vue'
import BatchActions from '../components/BatchActions.vue'

export default {
  name: 'ButtonManagement',
  components: {
    SearchForm,
    DataTable,
    Pagination,
    DialogForm,
    BatchActions
  },
  data() {
    // 使用CRUD辅助函数
    const crudData = useCRUD({
      fetchDataApi: getButtonList,
      defaultParams: {
        page: 1,
        page_size: 10
      },
      autoLoad: false
    })

    return {
      crudData,
      // 搜索表单配置
      searchFields: [
        {
          type: 'input',
          prop: 'name',
          label: '按钮名称',
          placeholder: '请输入按钮名称',
          width: '180px'
        },
        {
          type: 'input',
          prop: 'value',
          label: '权限标识',
          placeholder: '请输入权限标识',
          width: '180px'
        },
        {
          type: 'date',
          dateType: 'daterange',
          prop: 'created_at',
          label: '创建时间',
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期',
          width: '300px'
        }
      ],
      // 搜索表单数据
      searchForm: {
        name: '',
        value: '',
        created_at: []
      },
      // 表格列配置
      tableColumns: [
        {
          prop: 'id',
          label: '按钮ID',
          width: '80'
        },
        {
          prop: 'name',
          label: '按钮名称',
          minWidth: '120'
        },
        {
          prop: 'value',
          label: '权限标识',
          minWidth: '120'
        },
        {
          prop: 'created_at',
          label: '创建时间',
          minWidth: '180',
          sortable: true,
          formatter: (row) => this.formatDate(row.created_at)
        },
        {
          prop: 'updated_at',
          label: '更新时间',
          minWidth: '180',
          sortable: true,
          formatter: (row) => this.formatDate(row.updated_at)
        },
        {
          label: '操作',
          width: '240',
          fixed: 'right',
          actions: [
            {
              text: '详情',
              type: 'primary',
              action: 'detail'
            },
            {
              text: '编辑',
              action: 'edit'
            },
            {
              text: '删除',
              type: 'danger',
              action: 'delete'
            }
          ]
        }
      ],
      // 批量操作配置
      batchActions: [
        {
          label: '批量删除',
          type: 'danger',
          action: 'batchDelete'
        }
      ],
      // 表单字段配置
      formFields: [
        {
          type: 'input',
          prop: 'name',
          label: '按钮名称',
          placeholder: '请输入按钮名称'
        },
        {
          type: 'input',
          prop: 'value',
          label: '权限标识',
          placeholder: '请输入权限标识'
        }
      ],
      // 详情字段配置
      detailFields: [
        {
          type: 'text',
          prop: 'id',
          label: '按钮ID'
        },
        {
          type: 'text',
          prop: 'name',
          label: '按钮名称'
        },
        {
          type: 'text',
          prop: 'value',
          label: '权限标识'
        },
        {
          type: 'text',
          prop: 'created_at',
          label: '创建时间',
          formatter: (value) => this.formatDate(value)
        },
        {
          type: 'text',
          prop: 'updated_at',
          label: '更新时间',
          formatter: (value) => this.formatDate(value)
        }
      ],
      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入按钮名称', trigger: 'blur' },
          { min: 1, max: 64, message: '按钮名称长度在1到64个字符之间', trigger: 'blur' }
        ],
        value: [
          { required: true, message: '请输入权限标识', trigger: 'blur' },
          { min: 1, max: 64, message: '权限值长度在1到64个字符之间', trigger: 'blur' },
          { validator: this.validateUniqueValue, trigger: 'blur' }
        ]
      },
      // 表单数据
      formData: {
        id: 0,
        name: '',
        value: ''
      },
      // 详情数据
      detailForm: {
        id: 0,
        name: '',
        value: '',
        created_at: '',
        updated_at: ''
      },
      // 弹窗状态
      addDialogVisible: false,
      editDialogVisible: false,
      detailDialogVisible: false,
      // 选中的项目
      selectedItems: []
    }
  },
  mounted() {
    this.fetchButtonList()
  },
  methods: {
    // 获取按钮列表
    async fetchButtonList() {
      try {
        // 准备参数，移除空字符串
        const queryParams = {
          ...this.buildSearchParams()
        }
        
        // 使用crudData加载数据，并确保传递分页参数
        await this.crudData.fetchData({
          ...queryParams,
          page: this.crudData.currentPage,
          pageSize: this.crudData.pageSize
        })
      } catch (error) {
        this.$message.error('获取按钮列表失败')
        console.error('获取按钮列表失败:', error)
      }
    },
    
    // 构建搜索参数
    buildSearchParams() {
      const params = { ...this.searchForm }
      
      // 处理日期范围
      if (params.created_at && params.created_at.length === 2) {
        params.created_at__gte = new Date(params.created_at[0]).toISOString()
        const endDate = new Date(params.created_at[1])
        endDate.setHours(23, 59, 59, 999)
        params.created_at__lte = endDate.toISOString()
      }
      
      // 删除不需要的参数
      delete params.created_at
      
      return params
    },
    
    // 搜索
    handleSearch() {
      this.crudData.currentPage = 1
      this.fetchButtonList()
    },
    
    // 重置搜索
    handleReset() {
      this.searchForm = {
        name: '',
        value: '',
        created_at: []
      }
      this.crudData.currentPage = 1
      this.fetchButtonList()
    },
    
    // 分页大小改变
    handleSizeChange(pageSize) {
      this.crudData.handleSizeChange(pageSize)
    },
    
    // 处理当前页变化
    handleCurrentChange(currentPage) {
      this.crudData.handlePageChange(currentPage)
    },
    
    // 格式化日期，确保日期能正确解析
    formatDate(date) {
      if (!date) return ''
      try {
        return formatDate(date)
      } catch (error) {
        console.error('日期格式化错误', error)
        return date || ''
      }
    },
    
    // 刷新缓存
    async handleRefreshCache() {
      this.crudData.loading = true
      try {
        await refreshButtonCache()
        this.$message.success('按钮缓存刷新成功')
        this.fetchButtonList()
      } catch (error) {
        this.$message.error('按钮缓存刷新失败')
        console.error('刷新按钮缓存失败:', error)
      } finally {
        this.crudData.loading = false
      }
    },
    
    // 表单验证 - 权限值唯一性
    async validateUniqueValue(rule, value, callback) {
      if (!value) {
        callback(new Error('请输入权限标识'))
        return
      }
      
      try {
        // 检查是否为编辑状态且权限值未改变
        if (this.editDialogVisible && this.formData.value === value) {
          callback()
          return
        }
        
        const params = {
          value: value,
          page_size: 1
        }
        
        const response = await getButtonList(params)
        const hasDuplicate = response && response.results && response.results.length > 0
        
        if (hasDuplicate) {
          callback(new Error('该权限值已存在，请输入其他值'))
        } else {
          callback()
        }
      } catch (error) {
        console.error('验证权限值唯一性失败', error)
        callback(new Error('验证失败，请重试'))
      }
    },
    
    // 处理表格选择
    handleSelectionChange(selection) {
      this.selectedItems = selection
    },
    
    // 清空选择
    handleClearSelection() {
      this.selectedItems = []
      // 直接通过ref清空表格选择
      if (this.$refs.dataTable) {
        this.$refs.dataTable.clearSelection()
      }
    },
    
    // 处理批量操作
    handleBatchAction(action) {
      if (action === 'batchDelete') {
        this.handleBatchDelete()
      }
    },
    
    // 处理行操作
    handleRowAction({ action, row }) {
      switch (action) {
        case 'detail':
          this.viewButtonDetail(row)
          break
        case 'edit':
          this.openEditDialog(row)
          break
        case 'delete':
          this.handleDelete(row.id)
          break
      }
    },
    
    // 查看按钮详情
    viewButtonDetail(button) {
      this.detailForm = JSON.parse(JSON.stringify(button))
      this.detailDialogVisible = true
    },
    
    // 打开添加按钮弹窗
    openAddDialog() {
      this.formData = {
        id: 0,
        name: '',
        value: ''
      }
      this.addDialogVisible = true
    },
    
    // 添加按钮
    async handleAdd() {
      try {
        // 验证表单
        await validateForm(this.formData, this.formRules)
        
        const buttonData = {
          name: this.formData.name,
          value: this.formData.value
        }
        
        await createButton(buttonData)
        
        this.$message.success('添加成功')
        this.addDialogVisible = false
        this.fetchButtonList()
      } catch (error) {
        this.$message.error('添加失败: ' + (error.message || '未知错误'))
        console.error('添加按钮失败:', error)
      }
    },
    
    // 打开编辑按钮弹窗
    openEditDialog(button) {
      this.formData = JSON.parse(JSON.stringify(button))
      this.editDialogVisible = true
    },
    
    // 更新按钮
    async handleEdit() {
      try {
        // 验证表单
        await validateForm(this.formData, this.formRules)
        
        const buttonData = {
          name: this.formData.name,
          value: this.formData.value
        }
        
        await updateButton(this.formData.id, buttonData)
        
        this.$message.success('更新成功')
        this.editDialogVisible = false
        this.fetchButtonList()
      } catch (error) {
        this.$message.error('更新失败: ' + (error.message || '未知错误'))
        console.error('更新按钮失败:', error)
      }
    },
    
    // 删除按钮
    async handleDelete(buttonId) {
      try {
        await this.$confirm('确定要删除这个按钮吗？删除后将无法恢复！', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await deleteButton(buttonId)
        
        this.$message.success('删除成功')
        this.fetchButtonList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
          console.error('删除按钮失败:', error)
        }
      }
    },
    
    // 批量删除按钮
    async handleBatchDelete() {
      if (this.selectedItems.length === 0) {
        this.$message.warning('请选择要删除的按钮')
        return
      }
      
      try {
        await this.$confirm(`确定要删除选中${this.selectedItems.length} 个按钮吗？删除后将无法恢复！`, '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 批量删除
        for (const item of this.selectedItems) {
          await deleteButton(item.id)
        }
        
        this.$message.success(`成功删除 ${this.selectedItems.length} 个按钮`)
        this.fetchButtonList()
        this.selectedItems = []
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('批量删除失败')
          console.error('批量删除按钮失败:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
/* 状态样式 */
.status-enabled {
  color: #67c23a;
}

.status-disabled {
  color: #f56c6c;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
}
</style>