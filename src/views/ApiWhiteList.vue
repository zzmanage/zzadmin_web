<template>
  <div>
    <h1>接口白名单管理</h1>
    
    <!-- 查询条件区域 -->
    <SearchForm 
      :form-items="searchFields" 
      :form-data="searchForm"
      @search="handleSearch"
      @reset="resetForm"
    >
      <template #extra-buttons>
        <el-button type="primary" @click="addWhiteList" style="margin-right: 10px;">
          添加白名单
        </el-button>
        <el-button type="warning" @click="refreshWhiteListCache" style="margin-right: 10px;">
          刷新缓存
        </el-button>
      </template>
    </SearchForm>
    
    <!-- 批量操作按钮区域 -->
    <div class="action-buttons-container" style="margin-bottom: 15px;">
      <BatchActions
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :batch-buttons="[
          { label: '批量删除', type: 'danger', action: 'delete' }
        ]"
        @clear-selection="handleClearSelection"
        @batch-action="handleBatchAction"
      />
    </div>
    
    <!-- 白名单列表 -->
    <DataTable
      ref="dataTable"
      :data="dataList"
      :columns="tableColumns"
      :loading="loading"
      :show-selection="true"
      @selection-change="handleSelectionChange"
      @row-action="handleRowAction"
      :show-empty="true"
      empty-text="暂无白名单数据"
    />

    <!-- 分页控件 -->
    <Pagination 
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 添加/编辑白名单弹窗 -->
    <DialogForm
      :title="isEditing ? '编辑白名单' : '添加白名单'"
      v-model="dialogVisible"
      :form-data="currentWhiteList"
      :rules="rules"
      :form-items="formFields"
      @submit="saveWhiteList"
      width="600px"
    />
  </div>
</template>

<script>
import { getWhiteLists, createWhiteList, updateWhiteList, deleteWhiteList, refreshWhiteListCache } from '../api/whiteList'
import { formatDate } from '../utils/common/date-utils'
import SearchForm from '../components/SearchForm.vue'
import DataTable from '../components/DataTable.vue'
import DialogForm from '../components/DialogForm.vue'
import BatchActions from '../components/BatchActions.vue'
import Pagination from '../components/Pagination.vue'

export default {
  name: 'ApiWhiteList',
  components: {
    SearchForm,
    DataTable,
    DialogForm,
    BatchActions,
    Pagination
  },
  data() {
    return {
      loading: false,
      dialogVisible: false,
      isEditing: false,
      currentWhiteList: {
        url: '',
        method: '0',
        enable_datasource: false
      },
      searchForm: {
        url: '',
        method: '',
        enable_datasource: ''
      },
      rules: {
        url: [
          { required: true, message: '请输入URL地址', trigger: 'blur' }
        ],
        method: [
          { required: true, message: '请选择请求方法', trigger: 'change' }
        ]
      },
      // 直接管理数据和分      dataList: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      selectedIds: [],
      // 搜索表单配置
      searchFields: [
        { label: 'URL地址', prop: 'url', type: 'input', placeholder: '请输入URL地址' },
        {
          label: '请求方法',
          prop: 'method',
          type: 'select',
          width: '120px',
          options: [
            { label: '全部', value: '' },
            { label: 'GET', value: '0' },
            { label: 'POST', value: '1' },
            { label: 'PUT', value: '2' },
            { label: 'DELETE', value: '3' }
          ],
          placeholder: '请选择请求方法'
        },
        {
          label: '数据权限',
          prop: 'enable_datasource',
          type: 'select',
          width: '100px',
          options: [
            { label: '全部', value: '' },
            { label: '启用', value: true },
            { label: '禁用', value: false }
          ],
          placeholder: '请选择'
        }
      ],
      // 表格列配置
      tableColumns: [
        { prop: 'id', label: 'ID', sortable: true, minWidth: 80 },
        { prop: 'url', label: 'URL地址', sortable: true, minWidth: 300 },
        {
          prop: 'method',
          label: '请求方法',
          sortable: true,
          minWidth: 100,
          formatter: (row) => this.getMethodLabel(row.method)
        },
        {
          prop: 'enable_datasource',
          label: '数据权限',
          sortable: true,
          minWidth: 100,
          tag: true,
          tagType: (row) => {
            return row.enable_datasource ? 'success' : 'danger'
          },
          formatter: (value) => {
            return value  ? '启用' : '禁用'
          },
          // 添加自定义类名，方便后续可能的样式定          className: 'data-source-cell'
        },
        {
          prop: 'created_at',
          label: '创建时间',
          minWidth: 200,
          sortable: true,
          formatter: (row) => this.formatDate(row.created_at)
        },
        {
          label: '操作',
          width: 180,
          fixed: 'right',
          actions: [
            {
              text: '编辑',
              action: 'edit',
              size: 'small'
            },
            {
              text: '删除',
              action: 'delete',
              type: 'danger',
              size: 'small'
            }
          ]
        }
      ],
      // 添加/编辑白名单表单配置
      formFields: [
        { label: 'URL地址', prop: 'url', type: 'input', placeholder: '请输入URL地址' },
        {
          label: '请求方法',
          prop: 'method',
          type: 'select',
          options: [
            { label: 'GET', value: '0' },
            { label: 'POST', value: '1' },
            { label: 'PUT', value: '2' },
            { label: 'DELETE', value: '3' }
          ],
          placeholder: '请选择请求方法'
        },
        { label: '数据权限', prop: 'enable_datasource', type: 'switch' }
      ]
    }
  },
  mounted() {
    this.getWhiteLists()
  },
  methods: {
    // 获取白名单列表
    async getWhiteLists() {
      try {
        // 显示加载状态
        this.loading = true
        
        // 准备参数，移除空字符串
        const queryParams = {
          ...this.searchForm,
          page: this.currentPage,
          pageSize: this.pageSize
        }
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === '') {
            delete queryParams[key]
          }
        })
        
                
        // 直接调用API获取数据
        const response = await getWhiteLists(queryParams)
        
                
        // 根据响应结构设置数据
        // 兼容不同格式的响应
        if (response && response.results) {
          // 分页格式：{ results: [...], count: ... }
          this.dataList = response.results || []
          this.total = response.count || response.total || 0
        } else if (response && Array.isArray(response)) {
          // 简单数组格式
          this.dataList = response
          this.total = response.length
        } else if (response && response.data) {
          // 嵌套data格式
          if (Array.isArray(response.data)) {
            this.dataList = response.data
            this.total = response.data.length
          } else if (response.data.results) {
            this.dataList = response.data.results
            this.total = response.data.count || response.data.total || 0
          } else {
            this.dataList = []
            this.total = 0
          }
        } else {
          this.dataList = []
          this.total = 0
        }
        
        // 确保dataList中的method是数字类型，以便getMethodLabel函数正常工作
        this.dataList = this.dataList.map(item => ({
          ...item,
          method: parseInt(item.method, 10)
        }))
        
                      } catch (error) {
        this.dataList = []
        this.total = 0
        this.$message.error('获取白名单列表失败')
        console.error('获取白名单列表失败', error)
        // 详细记录错误信息，包括响应状态和响应数据
        if (error.response) {
          console.error('错误响应状态', error.response.status)
          console.error('错误响应数据', error.response.data)
        }
      } finally {
        // 隐藏加载状态
        this.loading = false
      }
    },
    
    // 刷新白名单缓存
    async refreshWhiteListCache() {
      this.loading = true
      try {
        await refreshWhiteListCache()
        this.$message.success('白名单缓存刷新成功')
        // 刷新列表数据
        this.getWhiteLists()
      } catch (error) {
        this.$message.error('白名单缓存刷新失败')
        console.error('刷新白名单缓存失败', error)
      } finally {
        this.loading = false
      }
    },
    
    // 搜索
    handleSearch() {
      this.currentPage = 1
      this.getWhiteLists()
    },
    
    // 重置表单
    resetForm() {
      this.searchForm = {
        url: '',
        method: '',
        enable_datasource: ''
      }
      this.currentPage = 1
      this.getWhiteLists()
    },
    
    // 分页大小改变
    handleSizeChange(pageSize) {
      this.pageSize = pageSize
      this.currentPage = 1 // 重置为第一页
      this.getWhiteLists()
    },
    
    // 当前页改变
    handleCurrentChange(currentPage) {
      this.currentPage = currentPage
      this.getWhiteLists()
    },
    
    // 选择行改变
    handleSelectionChange(selection) {
      this.selectedIds = selection.map(item => item.id)
    },
    
    // 清空选择
    handleClearSelection() {
      this.$refs.dataTable.clearSelection()
      this.selectedIds = []
    },
    
    // 处理批量操作
    handleBatchAction(action, selectedRows) {
      if (action === 'delete') {
        this.handleBatchDelete()
      }
    },
    
    // 获取请求方法标签
    getMethodLabel(method_index) {
            const methods = ['GET', 'POST', 'PUT', 'DELETE']
      return methods[method_index]
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
    
    // 处理行操作
    handleRowAction({action, row}) {
            if (action == 'edit') {
        this.editWhiteList(row)
      } else if (action == 'delete') {
        this.deleteWhiteList(row.id)
      }
    },
    
    // 添加白名单
    addWhiteList() {
      this.isEditing = false
      this.currentWhiteList = {
        url: '',
        method: '0',
        enable_datasource: false
      }
      this.dialogVisible = true
    },
    
    // 编辑白名单
    editWhiteList(row) {
      this.isEditing = true
      // 将数字类型的method转换为字符串类型
      this.currentWhiteList = {
        ...row,
        method: String(row.method)
      }
      this.dialogVisible = true
    },
    
    // 保存白名单
    async saveWhiteList(formData, callback) {
      try {
        // 创建提交数据，将字符串类型的method转换为数字类型
        const submitData = {
          ...formData,
          method: parseInt(formData.method, 10)
        }
        
        if (this.isEditing) {
          await updateWhiteList(submitData.id, submitData)
          this.$message.success('编辑成功')
        } else {
          await createWhiteList(submitData)
          this.$message.success('添加成功')
        }
        this.dialogVisible = false
        this.getWhiteLists()
        
        if (callback) callback()
      } catch (error) {
        // 解析错误信息，提供更明确的提示
        let errorMessage = this.isEditing ? '编辑失败' : '添加失败'
        
        // 处理url和method重复的错误
        if (error.response && error.response.data && error.response.data.non_field_errors) {
          const nonFieldErrors = error.response.data.non_field_errors
          if (nonFieldErrors.some(err => err.includes('url, method must make a unique set'))) {
            errorMessage = '该URL和请求方法的组合已存在，请尝试修改URL或请求方法'
          }
        }
        
        this.$message.error(errorMessage)
        console.error(this.isEditing ? '编辑白名单失败' : '添加白名单失败', error)
        
        if (callback) callback(error)
      }
    },
    
    // 删除白名单
    async deleteWhiteList(id) {
      this.$confirm('确定要删除这条白名单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteWhiteList(id)
          this.getWhiteLists()
          this.$message.success('删除成功')
        } catch (error) {
          this.$message.error('删除失败')
          console.error('删除白名单失败', error)
        }
      })
    },
    
    // 批量删除
    async handleBatchDelete() {
      if (this.selectedIds.length === 0) {
        this.$message.warning('请选择要删除的白名单')
        return
      }
      
      this.$confirm(`确定要删除选中{this.selectedIds.length}条白名单吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 循环删除，因为API中没有批量删除的方法
          for (const id of this.selectedIds) {
            await deleteWhiteList(id)
          }
          this.getWhiteLists()
          this.$message.success('批量删除成功')
        } catch (error) {
          this.$message.error('批量删除失败')
          console.error('批量删除白名单失败', error)
        }
      })
    },
    
    // 更新数据权限
    async updateDataSource(row) {
      try {
        await updateWhiteList(row.id, {
          ...row,
          enable_datasource: !row.enable_datasource
        })
        // 直接更新本地数据，避免重新请求
        row.enable_datasource = !row.enable_datasource
        this.$message.success('更新成功')
      } catch (error) {
        // 如果失败，恢复状态
        row.enable_datasource = !row.enable_datasource
        this.$message.error('更新失败')
        console.error('更新数据权限失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.el-button {
  margin-right: 10px;
}
.dialog-footer {
  text-align: right;
}
</style>