<template>
  <div>
    <h1>岗位管理</h1>
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
        <el-button type="primary" @click="openAddDialog" style="margin-right: 10px;">添加岗位</el-button>
        <ImportExport
          :api-prefix="'/api/posts'"
          :loading="crudData.loading"
          :export-params="getExportParams"
          @import-success="handleImportSuccess"
        />
      </template>
    </SearchForm>
    
    <!-- 使用BatchActions公共组件 - 批量操作区域 -->
    <BatchActions
      v-if="selectedRows.length > 0"
      :selected-count="selectedRows.length"
      @clear="clearSelection"
    >
      <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
        批量删除
      </el-button>
    </BatchActions>
    
    <!-- 使用DataTable公共组件 -->
    <DataTable 
      :data="crudData.dataList" 
      :columns="tableColumns" 
      :loading="crudData.loading"
      @selection-change="handleSelectionChange"
      :show-empty="true"
      empty-text="暂无岗位数据"
      :show-actions="true"
    >
      <!-- 操作列内-->
      <template #actions="{row}">
        <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
        <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
      </template>
      <!-- 状态列模板插槽 -->
      <template #column-status="{row}">
        <StatusTag :status="row.status" :status-map="statusMap" />
      </template>
    </DataTable>

    <!-- 使用DialogForm公共组件 - 添加弹窗 -->
    <DialogForm 
      v-model="addDialogVisible" 
      title="添加岗位" 
      :form-data="formData"
      :form-items="formFields"
      :rules="formRules"
      @submit="handleAdd"
    />

    <!-- 使用DialogForm公共组件 - 编辑弹窗 -->
    <DialogForm 
      v-model="editDialogVisible" 
      title="编辑岗位" 
      :form-data="formData"
      :form-items="formFields"
      :rules="formRules"
      @submit="handleEdit"
    />
    
    <!-- 使用Pagination公共组件 - 分页区域 -->
    <Pagination
      :total="crudData.total"
      :current-page="crudData.currentPage"
      :page-size="crudData.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>
  
<script>
import { getPostList, createPost, updatePost, deletePost, batchDeletePosts } from '../api/post'
import { useCRUD, validateForm } from '../utils/common/crud-helper'

// 导入公共组件
import SearchForm from '../components/SearchForm.vue'
import DataTable from '../components/DataTable.vue'
import DialogForm from '../components/DialogForm.vue'
import StatusTag from '../components/StatusTag.vue'
import Pagination from '../components/Pagination.vue'
import BatchActions from '../components/BatchActions.vue'
import ImportExport from '../components/ImportExport.vue'

// 使用CRUD辅助函数，配置分页参数
const crudData = useCRUD({
  fetchDataApi: getPostList,
  defaultParams: {},
  enablePagination: true,
  autoLoad: false // 禁用自动加载，因为我们会在mounted中手动调用
})

export default {
  name: 'Position',
  components: {
    SearchForm,
    DataTable,
    DialogForm,
    ImportExport,
    StatusTag,
    Pagination,
    BatchActions
  },
  data() {
    return {
      crudData,
      // 已选择的行数据
      selectedRows: [],
      
      // 搜索表单配置
      searchFields: [
        {
          type: 'input',
          prop: 'name',
          label: '岗位名称',
          placeholder: '请输入岗位名称'
        },
        {
          type: 'input',
          prop: 'code',
          label: '岗位编码',
          placeholder: '请输入岗位编码'
        },
        {
          type: 'select',
          prop: 'status',
          label: '岗位状态',
          placeholder: '请选择岗位状态',
          options: [
            { label: '全部', value: 2 },
            { label: '正常', value: 1 },
            { label: '停用', value: 0 }
          ],
          width: '100px'
        }
      ],
      // 搜索表单数据
      searchForm: {
        name: '',
        code: '',
        status: 2 // 默认查询所有状态
      },
      // 表格列配置
      tableColumns: [
        {
          type: 'selection',
          width: 55
        },
        {
          prop: 'name',
          label: '岗位名称'
        },
        {
          prop: 'code',
          label: '岗位编码'
        },
        {
          prop: 'sort',
          label: '岗位顺序'
        },
        {
          prop: 'status',
          label: '岗位状态',
          template: true
        }
      ],
      // 表单字段配置
      formFields: [
        {
          type: 'input',
          prop: 'name',
          label: '岗位名称',
          placeholder: '请输入岗位名称'
        },
        {
          type: 'input',
          prop: 'code',
          label: '岗位编码',
          placeholder: '请输入岗位编码'
        },
        {
          type: 'number',
          prop: 'sort',
          label: '岗位顺序',
          placeholder: '请输入岗位顺序',
          min: 1
        },
        {
          type: 'select',
          prop: 'status',
          label: '岗位状态',
          placeholder: '请选择岗位状态',
          options: [
            { label: '正常', value: 1 },
            { label: '停用', value: 0 }
          ]
        }
      ],
      // 表单数据
      formData: {
        id: 0,
        name: '',
        code: '',
        sort: 1,
        status: 1
      },
      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入岗位名称', trigger: 'blur' },
          { min: 2, max: 20, message: '岗位名称长度在2-20个字符之间', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入岗位编码', trigger: 'blur' },
          { min: 2, max: 20, message: '岗位编码长度在0个字符之间', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '请输入岗位顺序', trigger: 'blur' },
          { type: 'number', min: 1, message: '岗位顺序必须大于0', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择岗位状态', trigger: 'change' }
        ]
      },
      // 状态映射配置
      statusMap: {
        1: { text: '正常', type: 'success' },
        0: { text: '停用', type: 'danger' }
      },
      // 弹窗状态
      addDialogVisible: false,
      editDialogVisible: false
    }
  },
  computed: {
    // 计算导出参数，确保导出的数据与当前查询条件一致
    getExportParams() {
      const params = { ...this.buildSearchParams() }
      return params
    }
  },
  methods: {
    // 导入成功回调，刷新岗位列表
    handleImportSuccess() {
      this.fetchPosts()
    },
    
    // 获取岗位列表
    fetchPosts() {
      const params = this.buildSearchParams()
      // 确保参数包含分页信息并正确传递给fetchData方法
      this.crudData.fetchData({
        ...params,
        page: this.crudData.currentPage,
        pageSize: this.crudData.pageSize
      })
    },
    
    // 构建搜索参数
    buildSearchParams() {
      const params = { ...this.searchForm }
      // 如果状态选择的是所有，移除状态参数
      if (params.status === 2) {
        delete params.status
      }
      return params
    },
    
    // 搜索
    handleSearch() {
      this.fetchPosts()
    },
    
    // 重置搜索
    handleReset() {
      this.searchForm = {
        name: '',
        code: '',
        status: 2
      }
      this.fetchPosts()
    },
    
    // 分页大小变化
    handleSizeChange(pageSize) {
      this.crudData.handleSizeChange(pageSize)
    },
    
    // 当前页码变化
    handleCurrentChange(currentPage) {
      this.crudData.handlePageChange(currentPage)
    },
    
    // 选择项变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    
    // 清空选择
    clearSelection() {
      this.selectedRows = []
    },
    
    // 批量删除岗位
    async handleBatchDelete() {
      try {
        await this.$confirm('确定要删除选中' + this.selectedRows.length + '个岗位吗', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const ids = this.selectedRows.map(row => row.id)
        await batchDeletePosts({ ids })
        
        this.$message.success('批量删除成功')
        this.clearSelection()
        this.fetchPosts()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('批量删除失败')
          console.error('批量删除失败:', error)
        } else {
          this.$message.info('已取消删除')
        }
      }
    },
    
    // 处理行操作
    handleRowAction({ action, row }) {
      switch (action) {
      case 'edit' :
        this.openEditDialog(row)
        break
      case 'delete' :
        this.handleDelete(row.id)
        break
      }
    },
    
    // 打开添加岗位弹窗
    openAddDialog() {
      this.formData = {
        id: 0,
        name: '',
        code: '',
        sort: 1,
        status: 1
      }
      this.addDialogVisible = true
    },
    
    // 添加岗位
    async handleAdd() {
      try {
        // 验证表单
        await validateForm(this.formData, this.formRules)
        
        const postData = {
          name: this.formData.name,
          code: this.formData.code,
          sort: this.formData.sort,
          status: this.formData.status
        }
        
        await createPost(postData)
        
        this.$message.success('岗位添加成功')
        this.addDialogVisible = false
        this.fetchPosts()
      } catch (error) {
        this.$message.error('岗位添加失败: ' + (error.message || '未知错误'))
        console.error('添加岗位失败:', error)
      }
    },
    
    // 打开编辑岗位弹窗
    openEditDialog(post) {
      this.formData = { ...post }
      this.editDialogVisible = true
    },
    
    // 更新岗位
    async handleEdit() {
      try {
        // 验证表单
        await validateForm(this.formData, this.formRules)
        
        const postData = {
          name: this.formData.name,
          code: this.formData.code,
          sort: this.formData.sort,
          status: this.formData.status
        }
        
        await updatePost(this.formData.id, postData)
        
        this.$message.success('岗位更新成功')
        this.editDialogVisible = false
        this.fetchPosts()
      } catch (error) {
        this.$message.error('岗位更新失败: ' + (error.message || '未知错误'))
        console.error('更新岗位失败:', error)
      }
    },
    
    // 删除岗位
    async handleDelete(id) {
      try {
        await this.$confirm('确定要删除这个岗位吗', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await deletePost(id)
        
        this.$message.success('岗位删除成功')
        this.fetchPosts()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('岗位删除失败')
          console.error('删除岗位失败:', error)
        } else {
          this.$message.info('已取消删除')
        }
      }
    }
  },
  mounted() {
    this.fetchPosts()
  },
}
</script>
  
<style scoped>
.el-table {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
  