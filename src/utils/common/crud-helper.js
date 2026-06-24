import { ref, reactive, computed } from 'vue'
import { extractData } from '@/utils/api/responseHandler'

/**
 * CRUD操作辅助函数
 * 用于统一管理数据的增删改查操作
 * @param {Object} options - 配置选项
 * @param {Function} options.fetchDataApi - 获取数据的API函数
 * @param {Function} options.createDataApi - 创建数据的API函数
 * @param {Function} options.updateDataApi - 更新数据的API函数
 * @param {Function} options.deleteDataApi - 删除数据的API函数
 * @param {Object} options.defaultParams - 默认请求参数
 * @param {Boolean} options.enablePagination - 是否启用分页
 * @param {Boolean} options.autoLoad - 是否自动加载数据
 */
export function useCRUD(options = {}) {
  const {
    fetchDataApi,
    createDataApi,
    updateDataApi,
    deleteDataApi,
    defaultParams = {},
    enablePagination = true,
    autoLoad = true,
    processResponse,
    onError
  } = options

  // 加载状态
  const loading = ref(false)
  // 数据列表
  const dataList = ref([])
  // 总记录数
  const total = ref(0)
  // 当前页码
  const currentPage = ref(1)
  // 每页显示条数
  const pageSize = ref(20)
  // 查询参数
  const queryParams = reactive({ ...defaultParams })
  // 表单数据
  const formData = reactive({})
  // 弹窗可见性
  const dialogVisible = ref(false)
  // 编辑模式
  const isEdit = ref(false)
  // 选中的行
  const selectedRows = ref([])
  // 批量操作加载状态
  const batchLoading = ref(false)

  // 分页参数（计算属性）
  const paginationParams = computed(() => {
    if (!enablePagination) {
      return {}
    }
    return {
      page: currentPage.value,
      page_size: pageSize.value
    }
  })

  // 合并后的请求参数
  const requestParams = computed(() => {
    return {
      ...queryParams,
      ...paginationParams.value
    }
  })

  // 获取数据列表
  const fetchData = async (params = {}) => {
    try {
      if (typeof fetchDataApi !== 'function') {
        console.error('fetchDataApi is not a valid function')
        total.value = 0
        dataList.value = []
        return { success: false, message: 'Data fetch API not configured' }
      }

      loading.value = true
      const mergedParams = {
        ...requestParams.value,
        ...params
      }

      // apiRequest已经通过extractData提取了数据，返回的是数据本身而非原始响应对象
      const response = await fetchDataApi(mergedParams)

      if (response && typeof response === 'object') {
        // 检查是否是统一响应格式 { code, message, data }
        // 统一响应格式: { code: 200, message: '', data: {...} }
        // DRF分页响应格式: { results: [...], count: N }
        const isUnifiedFormat = 'code' in response && 'message' in response && 'data' in response
        const actualData = isUnifiedFormat ? response.data : response
        
        // 处理数据：如果是数组，直接使用；否则尝试提取分页数据
        let rawData = []
        let totalCount = 0
        
        if (Array.isArray(actualData)) {
          // 非分页数据：直接使用数组
          rawData = actualData
          totalCount = actualData.length
        } else if (actualData.results) {
          // DRF分页格式：{ results: [...], count: N }
          rawData = actualData.results
          totalCount = actualData.count || actualData.total || 0
        } else if (actualData.list) {
          // 其他分页格式：{ list: [...], total: N }
          rawData = actualData.list
          totalCount = actualData.total || actualData.count || 0
        } else if (actualData.records) {
          // 其他分页格式：{ records: [...], total: N }
          rawData = actualData.records
          totalCount = actualData.total || actualData.count || 0
        } else {
          // 未知格式：尝试直接使用
          rawData = []
          totalCount = 0
        }
        
        total.value = totalCount
        
        // 如果提供了processResponse函数，使用它处理数据
        if (typeof processResponse === 'function') {
          // 将actualData传递给processResponse（保持向后兼容）
          const processed = processResponse(actualData)
          // 如果返回的是数组，直接使用；否则尝试获取results字段
          dataList.value = Array.isArray(processed) ? processed : (processed.results || processed.list || processed.records || [])
        } else {
          dataList.value = rawData
        }
      } else {
        console.error('Failed to fetch data: Invalid response format', response)
        total.value = 0
        dataList.value = []
        return { success: false, message: 'Failed to fetch data: Invalid response format' }
      }

      return { success: true, data: response }
    } catch (error) {
      console.error('Error fetching data:', error)
      total.value = 0
      dataList.value = []
      
      // 如果提供了onError函数，调用它
      if (typeof onError === 'function') {
        onError(error)
      }
      
      return { success: false, message: 'Network error, please retry' }
    } finally {
      setTimeout(() => {
        loading.value = false
      }, 100)
    }
  }

  // 刷新数据
  const refreshData = () => {
    return fetchData()
  }

  // 重置查询条件
  const resetQuery = () => {
    Object.keys(queryParams).forEach(key => {
      delete queryParams[key]
    })
    Object.keys(defaultParams).forEach(key => {
      queryParams[key] = defaultParams[key]
    })
    currentPage.value = 1
    return fetchData()
  }

  // 处理页码变化
  const handlePageChange = (newPage) => {
    currentPage.value = newPage
    fetchData()
  }

  // 处理每页条数变化
  const handleSizeChange = (newSize) => {
    pageSize.value = newSize
    currentPage.value = 1
    fetchData()
  }

  // 打开添加弹窗
  const openCreateDialog = () => {
    isEdit.value = false
    Object.keys(formData).forEach(key => {
      delete formData[key]
    })
    dialogVisible.value = true
  }

  // 打开编辑弹窗
  const openEditDialog = (row) => {
    isEdit.value = true
    Object.assign(formData, { ...row })
    dialogVisible.value = true
  }

  // 关闭弹窗
  const closeDialog = () => {
    dialogVisible.value = false
    Object.keys(formData).forEach(key => {
      delete formData[key]
    })
  }

  // 保存数据（添加或编辑）
  const saveData = async () => {
    try {
      loading.value = true

      if (isEdit.value) {
        await updateDataApi(formData)
      } else {
        await createDataApi(formData)
      }

      closeDialog()
      refreshData()
      return { success: true, message: isEdit.value ? 'Update successful' : 'Create successful' }
    } catch (error) {
      console.error('Error saving data:', error)
      return { success: false, message: 'Network error, please retry' }
    } finally {
      loading.value = false
    }
  }

  // 删除单条数据
  const deleteSingleData = async (id, confirm = true) => {
    try {
      if (confirm && !window.confirm('Confirm deletion')) {
        return { success: false, message: 'Deletion cancelled' }
      }

      loading.value = true
      await deleteDataApi(id)

      refreshData()
      return { success: true, message: 'Delete successful' }
    } catch (error) {
      console.error('Error deleting data:', error)
      return { success: false, message: 'Network error, please retry' }
    } finally {
      loading.value = false
    }
  }

  // 批量删除数据
  const deleteBatchData = async (ids, confirm = true) => {
    try {
      if (!ids || ids.length === 0) {
        return { success: false, message: 'Please select data to delete' }
      }

      if (confirm && !window.confirm(`Confirm deletion of ${ids.length} items`)) {
        return { success: false, message: 'Deletion cancelled' }
      }

      batchLoading.value = true
      const deleteParams = Array.isArray(ids) && ids.length === 1 ? ids[0] : ids
      await deleteDataApi(deleteParams)

      selectedRows.value = []
      refreshData()
      return { success: true, message: 'Batch delete successful' }
    } catch (error) {
      console.error('Error batch deleting data:', error)
      return { success: false, message: 'Network error, please retry' }
    } finally {
      batchLoading.value = false
    }
  }

  // 处理选择变化
  const handleSelectionChange = (rows) => {
    selectedRows.value = rows
  }

  // 清空选择
  const clearSelection = () => {
    selectedRows.value = []
  }

  // 导出CSV
  const exportCSV = async (params = {}) => {
    try {
      loading.value = true
      const mergedParams = {
        ...requestParams.value,
        ...params,
        export: true
      }

      await fetchDataApi(mergedParams)
      return { success: true, message: 'Export successful' }
    } catch (error) {
      console.error('Error exporting data:', error)
      return { success: false, message: 'Export failed, please retry' }
    } finally {
      loading.value = false
    }
  }

  // 初始化时自动加载数据
  if (autoLoad && fetchDataApi) {
    fetchData()
  }

  return {
    get loading() { return loading.value },
    set loading(val) { loading.value = val; return true },
    get dataList() { return dataList.value },
    set dataList(val) { dataList.value = val; return true },
    get items() { return dataList.value },
    set items(val) { dataList.value = val; return true },
    get total() { return total.value },
    set total(val) { total.value = val; return true },
    get currentPage() { return currentPage.value },
    set currentPage(val) { currentPage.value = val; return true },
    get pageSize() { return pageSize.value },
    set pageSize(val) { pageSize.value = val; return true },
    queryParams,
    params: queryParams,
    formData,
    get dialogVisible() { return dialogVisible.value },
    set dialogVisible(val) { dialogVisible.value = val; return true },
    get isEdit() { return isEdit.value },
    set isEdit(val) { isEdit.value = val; return true },
    get selectedRows() { return selectedRows.value },
    set selectedRows(val) { selectedRows.value = val; return true },
    get selectedIds() { return selectedRows.value.map(row => row.id) },
    set selectedIds(ids) {
      if (ids && Array.isArray(ids) && dataList.value.length) {
        selectedRows.value = dataList.value.filter(row => ids.includes(row.id))
      } else {
        selectedRows.value = []
      }
      return true
    },
    get batchLoading() { return batchLoading.value },
    set batchLoading(val) { batchLoading.value = val; return true },
    paginationParams,
    requestParams,
    pagination: {
      get currentPage() { return currentPage.value },
      set currentPage(val) { currentPage.value = val; return true },
      get pageSize() { return pageSize.value },
      set pageSize(val) { pageSize.value = val; return true }
    },
    fetchData,
    refreshData,
    resetQuery,
    handlePageChange,
    handleSizeChange,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    saveData,
    deleteSingleData,
    deleteBatchData,
    handleSelectionChange,
    clearSelection,
    exportCSV
  }
}

/**
 * 表单验证辅助函数
 * @param {Object} rules - 验证规则
 * @param {Object} formData - 表单数据
 * @returns {Object} 验证结果
 */
export function validateForm(rules, formData) {
  const errors = {}
  let isValid = true

  for (const [key, ruleList] of Object.entries(rules)) {
    if (!Array.isArray(ruleList)) {
      continue
    }

    for (const rule of ruleList) {
      const value = formData[key]

      if (rule.required && (value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' && Object.keys(value).length === 0))) {
        errors[key] = rule.message || `${key} cannot be empty`
        isValid = false
        break
      }

      if (rule.type && value !== undefined && value !== null && value !== '') {
        let typeValid = true
        switch (rule.type) {
        case 'number':
          typeValid = !isNaN(Number(value))
          break
        case 'string':
          typeValid = typeof value === 'string'
          break
        case 'boolean':
          typeValid = typeof value === 'boolean'
          break
        case 'array':
          typeValid = Array.isArray(value)
          break
        case 'object':
          typeValid = typeof value === 'object' && value !== null && !Array.isArray(value)
          break
        case 'email':
          typeValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
          break
        case 'url':
          typeValid = /^(https:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/$/.test(value)
          break
        default:
          typeValid = true
        }

        if (!typeValid) {
          errors[key] = rule.message || `${key} format is invalid`
          isValid = false
          break
        }
      }

      if (rule.min !== undefined && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length < rule.min) {
            errors[key] = rule.message || `${key} requires at least ${rule.min} items`
            isValid = false
            break
          }
        } else if (typeof value === 'string') {
          if (value.length < rule.min) {
            errors[key] = rule.message || `${key} requires at least ${rule.min} characters`
            isValid = false
            break
          }
        }
      }

      if (rule.max !== undefined && value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > rule.max) {
            errors[key] = rule.message || `${key} allows at most ${rule.max} items`
            isValid = false
            break
          }
        } else if (typeof value === 'string') {
          if (value.length > rule.max) {
            errors[key] = rule.message || `${key} allows at most ${rule.max} characters`
            isValid = false
            break
          }
        } else if (typeof value === 'number') {
          if (value > rule.max) {
            errors[key] = rule.message || `${key} cannot be greater than ${rule.max}`
            break
          }
        }
      }

      if (rule.pattern && value !== undefined && value !== null && value !== '') {
        if (!rule.pattern.test(value)) {
          errors[key] = rule.message || `${key} format is invalid`
          isValid = false
          break
        }
      }

      if (rule.validator && typeof rule.validator === 'function') {
        const result = rule.validator(value, formData)
        if (result !== true) {
          errors[key] = result || rule.message || `${key} validation failed`
          isValid = false
          break
        }
      }
    }
  }

  return { isValid, errors }
}
