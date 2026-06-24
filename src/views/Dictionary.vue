<template>
  <div>
    <h1>字典管理</h1>
    
    <!-- 查询条件区域 -->
    <SearchForm :form-items="searchFields" :form-data="searchForm" @search="handleSearch" @reset="resetForm">
          <template #extra-buttons>
      <ActionButton type="primary" @click="openDialog">添加字典</ActionButton>
      <ActionButton type="primary" @click="refreshDictCache" style="margin-right: 10px;">刷新缓存</ActionButton>
    <ImportExport 
        :api-prefix="'/api/dictionary'"
        :loading="loading"
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
      <ActionButton type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
        批量删除
      </ActionButton>
    </BatchActions>
    
    <!-- 字典列表 -->
    <DataTable
      :columns="tableColumns"
      :data="dictionaries"
      :loading="loading"
      @selection-change="handleSelectionChange"
      :show-empty="true"
      empty-text="暂无字典数据"
      :show-actions="true"
    >
      <!-- 操作列内-->
      <template #actions="{row}">
        <ActionButton size="small" @click="editDictionary(row)">编辑</ActionButton>
        <ActionButton size="small" type="primary" @click="configDictionary(row)">配置字典</ActionButton>
        <ActionButton size="small" type="danger" @click="deleteDictionary(row.id)">删除</ActionButton>
      </template>
      <!-- 状态列自定义模-->
      <template #column-status="{row}">
        <el-tag :type="row.status ? 'success' : 'warning'">
          {{ row.status ? '正常' : '停用' }}
        </el-tag>
      </template>
    </DataTable>
    
    <!-- 分页组件 -->
    <Pagination
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
    
    <!-- 字典项弹-->
    <DialogForm
      :title="isEditing ? '编辑字典' : '添加字典'"
      v-model="dialogVisible"
      :form-items="formFields"
      :form-data="formData"
      :rules="rules"
      @submit="submitForm"
      width="600px"
    />
    
    <!-- 字典配置抽屉 -->
    <el-drawer
      title="配置字典"
      v-model="drawerVisible"
      direction="rtl"
      size="60%"
    >
      <div>
        <!-- 字典项搜索表-->
        <SearchForm 
          :form-items="dictItemSearchFields" 
          :form-data="dictItemSearchForm" 
          @search="handleDictItemSearch" 
          @reset="resetDictItemForm"
          :inline="true"
        >
          <template #extra-actions>
            <ActionButton type="primary" @click="openDictItemDialog">添加字典项</ActionButton>
          </template>
        </SearchForm>
        
        <!-- 字典项列-->
        <DataTable
          :columns="dictItemTableColumns"
          :data="dictItems"
          :loading="dictItemLoading"
          style="margin-top: 20px;"
          :show-actions="true"
        >
          <!-- 字典项操作列内容 -->
          <template #actions="{row}">
            <ActionButton size="small" @click="openDictItemDialog(row)">编辑</ActionButton>
            <ActionButton size="small" type="danger" @click="deleteDictItem(row.id)">删除</ActionButton>
          </template>
          <!-- 字典项状态列自定义模-->
          <template #column-status="{row}">
            <el-tag :type="row.status ? 'success' : 'warning'">
              {{ row.status ? '正常' : '停用' }}
            </el-tag>
          </template>
        </DataTable>
        
        <!-- 字典项弹-->
        <DialogForm
          :title="isEditingDictItem ? '编辑字典项' : '添加字典项'"
          v-model="dictItemDialogVisible"
          :form-items="dictItemFormFields"
          :form-data="dictItemFormData"
          :rules="dictItemRules"
          @submit="submitDictItemForm"
          width="500px"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { getDictionaryList, createDictionary, updateDictionary, deleteDictionary, getDictionaryItems, addDictionaryItem, updateDictionaryItem, deleteDictionaryItem, refreshDictionaryCache } from '../api/dictionary'
import SearchForm from '../components/SearchForm.vue'
import BatchActions from '../components/BatchActions.vue'
import ActionButton from '../components/ActionButton.vue'
import DataTable from '../components/DataTable.vue'
import DialogForm from '../components/DialogForm.vue'
import ImportExport from '../components/ImportExport.vue'
import Pagination from '../components/Pagination.vue'
import { useCRUD } from '../utils/common/crud-helper'
import { ref, computed, watch, onMounted, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
export default {
  name: 'Dictionary',
  components: {
    SearchForm,
    BatchActions,
    ActionButton,
    DataTable,
    DialogForm,
    ImportExport,
    Pagination
  },
  setup() {
    // 数据类型选项
    const typeOptions = [
      { value: 0, label: 'text' },
      { value: 1, label: 'number' },
      { value: 2, label: 'date' },
      { value: 3, label: 'datetime' },
      { value: 4, label: 'time' },
      { value: 5, label: 'files' },
      { value: 6, label: 'boolean' },
      { value: 7, label: 'images' }
    ]

    // 使用CRUD辅助函数管理数据加载
    const crudData = useCRUD({
      autoLoad: false,
      fetchDataApi: getDictionaryList,
      defaultParams: {},
      enablePagination: true,
      processResponse: (response) => {
        const results = response.results || []
        // 处理数据，添加父级字典名称和数据类型名称
        return results.map(dict => {
          const typeItem = typeOptions.find(t => t.value === dict.type)
          return {
            ...dict,
            parent_label: dict.parent_label || '',
            type_label: typeItem ? typeItem.label : 'text'
          }
        })
      },
      onError: (error) => {
        console.error('获取字典列表失败:', error)
      }
    })

    // 使用computed保持响应式连接
    const loading = computed(() => crudData.loading)
    const dictionaries = computed(() => crudData.dataList)
    const total = computed(() => crudData.total)
    const currentPage = computed(() => crudData.currentPage)
    const pageSize = computed(() => crudData.pageSize)

    // 数据加载将在onMounted中通过fetchDictionaries完成
    
    // 搜索表单字段配置
    const searchFields = [
      {
        prop: 'label',
        label: '字典名称',
        type: 'input',
        placeholder: '请输入字典名称'
      },
      {
        prop: 'value',
        label: '字典编号',
        type: 'input',
        placeholder: '请输入字典编号'
      }
    ]
    
    // 表格列配置
    const tableColumns = [
      {
        type: 'selection',
        width: 55
      },
      {
        prop: 'id',
        label: 'ID',
        width: 80
      },
      {
        prop: 'label',
        label: '字典名称'
      },
      {
        prop: 'value',
        label: '字典编号'
      },
      {
        prop: 'status',
        label: '状态',
        width: 100,
        template: true
      },
      {
        prop: 'sort',
        label: '排序',
        width: 80
      }
    ]
      
    // 表单字段配置
    const formFields = [
      {
        prop: 'label',
        label: '字典名称',
        type: 'input',
        placeholder: '请输入字典名称'
      },
      {
        prop: 'value',
        label: '字典编号',
        type: 'input',
        placeholder: '请输入字典编号'
      },
      {
        prop: 'status',
        label: '状态',
        type: 'switch'
      },
      {
        prop: 'sort',
        label: '排序',
        type: 'number',
        min: 1
      },
      {
        prop: 'remark',
        label: '备注',
        type: 'textarea',
        placeholder: '请输入备注',
        rows: 4
      }
    ]
      
    // 字典项搜索表单配置
    const dictItemSearchFields = [
      {
        prop: 'label',
        label: '字典项名称',
        type: 'input',
        placeholder: '请输入字典项名称'
      }
    ]
      
    // 字典项表格列配置
    const dictItemTableColumns = [
      {
        prop: 'id',
        label: 'ID',
        width: 80
      },
      {
        prop: 'label',
        label: '字典项名称'
      },
      {
        prop: 'value',
        label: '字典项值'
      },
      {
        prop: 'status',
        label: '状态',
        width: 100,
        template: true
      },
      {
        prop: 'sort',
        label: '排序',
        width: 80
      }
    ]
      
    // 字典项表单字段配置
    const dictItemFormFields = [
      {
        prop: 'label',
        label: '字典项名称',
        type: 'input',
        placeholder: '请输入字典项名称'
      },
      {
        prop: 'value',
        label: '字典项值',
        type: 'input',
        placeholder: '请输入字典项值'
      },
      {
        prop: 'status',
        label: '状态',
        type: 'switch'
      },
      {
        prop: 'sort',
        label: '排序',
        type: 'number',
        min: 1
      },
      {
        prop: 'remark',
        label: '备注',
        type: 'textarea',
        placeholder: '请输入备注',
        rows: 3
      }
    ]
      
    // 字典列表相关
    const searchForm = ref({
      label: '',
      value: '',
      parent: ''
    })
    const selectedRows = ref([])
      
    // 字典表单相关
    const dialogVisible = ref(false)
    const isEditing = ref(false)
    const formData = ref({
      id: null,
      label: '',
      value: '',
      parent: null,
      type: 0,
      color: '',
      is_value: false,
      status: true,
      sort: 1,
      remark: ''
    })
      
    // 字典配置抽屉相关
    const drawerVisible = ref(false)
    const currentDict = ref(null)
    const dictItems = ref([])
    const dictItemLoading = ref(false)
    const dictItemSearchForm = ref({
      label: ''
    })
    const dictItemDialogVisible = ref(false)
    const isEditingDictItem = ref(false)
    const dictItemFormData = ref({
      id: null,
      label: '',
      value: '',
      status: true,
      sort: 1,
      remark: ''
    })
      
    // 表单验证规则
    const rules = {
      label: [
        { required: true, message: '请输入字典名称', trigger: 'blur' },
        { min: 1, max: 100, message: '长度1-100个字', trigger: 'blur' }
      ],
      value: [
        { required: true, message: '请输入字典编号', trigger: 'blur' },
        { min: 1, max: 200, message: '长度1-200个字', trigger: 'blur' }
      ],
      remark: [
        { max: 2000, message: '长度不超过2000个字', trigger: 'blur' }
      ]
    }
      
    const dictItemRules = {
      label: [
        { required: true, message: '请输入字典项名称', trigger: 'blur' },
        { min: 1, max: 100, message: '长度1-100个字', trigger: 'blur' }
      ],
      value: [
        { required: true, message: '请输入字典项值', trigger: 'blur' },
        { min: 1, max: 200, message: '长度1-200个字', trigger: 'blur' }
      ],
      remark: [
        { max: 2000, message: '长度不超过2000个字', trigger: 'blur' }
      ]
    }
      
    // 获取字典列表
    const fetchDictionaries = (params = {}) => {
      // 合并搜索表单参数，分页参数由crud-helper自动处理
      const searchParams = {
        ...searchForm.value,
        ...params
      }
      crudData.fetchData(searchParams)
    }
      
    // 搜索
    const handleSearch = () => {
      fetchDictionaries()
    }
      
    // 重置表单
    const resetForm = () => {
      searchForm.value = {
        label: '',
        value: '',
        parent: ''
      }
      fetchDictionaries()
    }
      
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }
      
    // 清空选择
    const clearSelection = () => {
      selectedRows.value = []
    }
      
    // 刷新字典缓存
    const refreshDictCache = async () => {
      try {
        await refreshDictionaryCache()
        ElMessage.success('字典缓存刷新成功')
        // 刷新列表
        fetchDictionaries()
      } catch (error) {
        console.error('刷新字典缓存失败:', error)
        ElMessage.error('刷新字典缓存失败')
      }
    }
      
    // 打开弹窗
    const openDialog = (dictionary = null) => {
      isEditing.value = !!dictionary
      if (dictionary) {
        formData.value = { ...dictionary }
      } else {
        formData.value = {
          id: null,
          label: '',
          value: '',
          parent: null,
          type: 0,
          color: '',
          is_value: false,
          status: true,
          sort: 1,
          remark: ''
        }
      }
      dialogVisible.value = true
    }
      
    // 处理行操作
    const handleRowAction = (action, row) => {
      switch (action) {
      case 'edit' :
        openDialog(row)
        break
      case 'config' :
        currentDict.value = { ...row }
        drawerVisible.value = true
        break
      case 'delete' :
        deleteDictionary(row.id)
        break
      }
    }
      
    // 导入成功处理
    const handleImportSuccess = () => {
      ElMessage.success('导入成功')
      fetchDictionaries()
    }
      
    // 分页处理
    const handleSizeChange = (size) => {
      crudData.pageSize = size
      fetchDictionaries()
    }
      
    const handleCurrentChange = (current) => {
      crudData.currentPage = current
      fetchDictionaries()
    }
      
    // 批量删除
    const handleBatchDelete = () => {
      ElMessageBox.confirm('确定要批量删除选中的字典吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const ids = selectedRows.value.map(row => row.id)
          await Promise.all(ids.map(id => deleteDictionary(id)))
          ElMessage.success('删除成功')
          fetchDictionaries()
          clearSelection()
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
      
    // 编辑字典
    const editDictionary = (row) => {
      isEditing.value = true
      formData.value = { ...row }
      dialogVisible.value = true
    }
      
    // 配置字典
    const configDictionary = (row) => {
      currentDict.value = { ...row }
      drawerVisible.value = true
    }
      
    // 删除字典
    const deleteDictionary = async (id) => {
      ElMessageBox.confirm('确定要删除这个字典吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteDictionary(id)
          ElMessage.success('删除成功')
          fetchDictionaries()
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
      
    // 提交表单
    const submitForm = async () => {
      try {
        if (isEditing.value) {
          // updateDictionary需要两个参 dictId和data
          await updateDictionary(formData.value.id, formData.value)
          ElMessage.success('更新成功')
        } else {
          await createDictionary(formData.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchDictionaries()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    }
      
    // 提交字典项表单
    const submitDictItemForm = async () => {
      try {
        const params = {
          ...dictItemFormData.value,
          dict_id: currentDict.value.id
        }
          
        if (isEditingDictItem.value) {
          // updateDictionaryItem需要三个参 dictId, itemId, data
          await updateDictionaryItem(currentDict.value.id, dictItemFormData.value.id, params)
          ElMessage.success('更新成功')
        } else {
          // addDictionaryItem需要两个参 dictId, data
          await addDictionaryItem(currentDict.value.id, params)
          ElMessage.success('创建成功')
        }
        dictItemDialogVisible.value = false
        fetchDictItems()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    }
      
    // 打开字典项弹窗
    const openDictItemDialog = (dictItem = null) => {
      isEditingDictItem.value = !!dictItem
      if (dictItem) {
        dictItemFormData.value = { ...dictItem }
      } else {
        dictItemFormData.value = {
          id: null,
          label: '',
          value: '',
          status: true,
          sort: 1,
          remark: ''
        }
      }
      dictItemDialogVisible.value = true
    }
      
    // 获取字典项列表
    const fetchDictItems = async () => {
      if (!currentDict.value) return
        
      dictItemLoading.value = true
      try {
        const response = await getDictionaryItems(currentDict.value.id, dictItemSearchForm.value)
        dictItems.value = response
      } catch (error) {
        console.error('获取字典项失败', error)
        ElMessage.error('获取字典项失败')
      } finally {
        dictItemLoading.value = false
      }
    }
      
    // 监听抽屉可见性变化
    watch(() => drawerVisible.value, (newVal) => {
      if (newVal && currentDict.value) {
        fetchDictItems()
      }
    })
      
    // 处理字典项搜索
    const handleDictItemSearch = () => {
      fetchDictItems()
    }
      
    // 重置字典项表单
    const resetDictItemForm = () => {
      dictItemSearchForm.value = {
        label: ''
      }
      fetchDictItems()
    }
      
    // 处理字典项行操作
    const handleDictItemRowAction = (param) => {
      const { action, row } = param
      switch (action) {
      case 'edit' :
        openDictItemDialog(row)
        break
      case 'delete' :
        deleteDictItem(row.id)
        break
      }
    }
      
    // 删除字典项
    const deleteDictItem = async (id) => {
      ElMessageBox.confirm('确定要删除这个字典项吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        dictItemLoading.value = true
        try {
          // deleteDictionaryItem需要两个参 dictId, itemId
          await deleteDictionaryItem(currentDict.value.id, id)
          ElMessage.success('删除成功')
          fetchDictItems()
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        } finally {
          dictItemLoading.value = false
        }
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
      
    // 获取导出参数
    const getExportParams = computed(() => {
      return {
        ...searchForm.value
      }
    })
      
    // 组件挂载后加载数据
    onMounted(() => {
      fetchDictionaries()
    })
      
    return {
      // 字典列表相关
      loading,
      dictionaries,
      total,
      currentPage,
      pageSize,
      searchForm,
      searchFields,
      tableColumns,
      selectedRows,
        
      // 字典表单相关
      dialogVisible,
      isEditing,
      formData,
      formFields,
      rules,
        
      // 字典配置抽屉相关
      drawerVisible,
      currentDict,
      dictItems,
      dictItemLoading,
      dictItemSearchForm,
      dictItemSearchFields,
      dictItemDialogVisible,
      isEditingDictItem,
      dictItemFormData,
      dictItemFormFields,
      dictItemTableColumns,
      dictItemRules,
        
      // 方法
      fetchDictionaries,
      handleSearch,
      resetForm,
      handleSelectionChange,
      clearSelection,
      refreshDictCache,
      openDialog,
      handleRowAction,
      handleImportSuccess,
      handleSizeChange,
      handleCurrentChange,
      handleBatchDelete,
      editDictionary,
      configDictionary,
      deleteDictionary,
      submitForm,
      submitDictItemForm,
      openDictItemDialog,
      fetchDictItems,
      handleDictItemSearch,
      resetDictItemForm,
      handleDictItemRowAction,
      deleteDictItem,
      getExportParams
    }
  }
}
</script>

<style scoped>
/* 样式可根据需要进行调*/
</style>
  