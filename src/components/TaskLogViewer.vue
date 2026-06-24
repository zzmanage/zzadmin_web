<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`任务日志 - ${taskName || 'ID: ' + taskId}`"
    width="80%"
    @close="handleClose"
  >
    <div class="log-viewer-container">
      <!-- 搜索和筛选区-->
    <div class="search-filter-section">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="日志内容">
          <el-input v-model="searchForm.content" placeholder="请输入搜索内容" style="width: 250px" />
        </el-form-item>
        <el-form-item label="日志级别">
          <el-select v-model="searchForm.level" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="DEBUG" value="DEBUG" />
            <el-option label="INFO" value="INFO" />
            <el-option label="WARNING" value="WARNING" />
            <el-option label="ERROR" value="ERROR" />
            <el-option label="CRITICAL" value="CRITICAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="searchForm.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="运行" value="running" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="已取消" value="canceled" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchLogs">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="default" @click="refreshLogs">刷新</el-button>
          <el-switch 
            v-model="autoScrollEnabled"
            active-text="自动滚动"
            inactive-text="关闭"
            style="margin-left: 10px; margin-top: 4px;"
          />
        </el-form-item>
      </el-form>
    </div>
      
      <!-- 日志内容区域 -->
      <div class="log-content-section">
        <el-table border
          ref="logTableRef"
          v-loading="loading"
          :data="logData"
          style="width: 100%"
          size="small"
          @row-click="handleRowClick"
        >
          <el-table-column prop="start_time" label="开始时间" width="200" sortable />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" class="status-tag">
                {{ getStatusDisplay(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时" width="100" sortable>
            <template #default="scope">
              <span>{{ calculateDuration(scope.row.start_time, scope.row.end_time) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="task_name" label="任务名称" width="180" />
          <el-table-column prop="result" label="执行结果" show-overflow-tooltip min-width="300">
            <template #default="scope">
              <div class="log-result-content">
            <pre class="log-message" v-html="formatLogMessage(scope.row.result || scope.row.error_message)"></pre>
            <div v-if="scope.row.task_id" class="task-id-info">
              <small>任务ID: {{ scope.row.task_id }}</small>
            </div>
          </div>
            </template>
          </el-table-column>
          <el-table-column prop="error_message" label="错误信息" min-width="200">
            <template #default="scope">
              <div v-if="scope.row.traceback" class="traceback-container">
                <el-button type="text" @click="showFullTraceback(scope.row.traceback)">
                  查看完整异常
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="scope">
              <el-button 
                v-if="scope.row.status === 'running' || scope.row.status === 2"
                type="danger" 
                size="small" 
                @click="cancelTask(scope.row)"
                icon="Stopwatch"
                circle
                title="取消任务"
              />
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页控件 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
        
        <!-- 无日志提-->
        <div v-if="!loading && logData.length === 0" class="no-logs-tip">
          <el-empty description="暂无日志数据" />
          <el-button 
            type="primary" 
            size="small" 
            @click="searchAllLogs"
            style="margin-top: 10px;"
          >
            尝试搜索所有日志
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 完整异常信息弹窗 -->
        <el-dialog
          v-model="showTracebackDialog"
          title="完整异常信息"
          width="80%"
        >
          <pre class="traceback-content">{{ currentTraceback }}</pre>
          <template #footer>
            <el-button @click="showTracebackDialog = false">关闭</el-button>
          </template>
        </el-dialog>
      </el-dialog>
    </template>
    
<script>
import { ref, reactive, watch, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTaskLogs, revokeTask } from '../api/task' // 导入revokeTask函数
    
export default {
  name: 'TaskLogViewer',
  props: {
    taskId: {
      type: [String, Number],
      required: true
    },
    taskName: {
      type: String,
      default: ''
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const dialogVisible = ref(false)
    const loading = ref(false)
    const logData = ref([])
    const showTracebackDialog = ref(false)
    const currentTraceback = ref('')
    const logTableRef = ref(null)
    const autoScrollEnabled = ref(true) // 默认启用自动滚动
        
    const searchForm = reactive({
      content: '',
      level: '',
      status: ''
    })
        
    const dateRange = ref([])
        
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })
        
    // 监听taskId变化，如果有值并且对话框是打开的，则刷新日志
    // 添加一个标志来避免重复加载
    const isInitialLoad = ref(true)
    watch(() => props.taskId, (newTaskId) => {
      if (newTaskId && dialogVisible.value && !isInitialLoad.value) {
        loadLogs()
      }
      isInitialLoad.value = false
    })
    
    // 打开日志查看器
    const open = () => {
      if (!props.taskId) {
        ElMessage.error('任务ID不能为空')
        return
      }
          
      // 重置搜索条件和分页
      resetSearch()
          
      // 打开对话框
      dialogVisible.value = true
          
      // 加载日志数据
      loadLogs()
    }
        
    // 动态滚动到最新日志
      const scrollToLatestLog = () => {
      if (!autoScrollEnabled.value) return
          
      nextTick(() => {
        if (logTableRef.value && logData.value.length > 0) {
          const tableEl = logTableRef.value.$el
          const bodyWrapper = tableEl.querySelector('.el-table__body-wrapper')
          if (bodyWrapper) {
            bodyWrapper.scrollTop = bodyWrapper.scrollHeight
          }
        }
      })
    }

    // 状态映射 - 后端整数状态值到前端显示文本
    const getStatusDisplay = (status) => {
      const statusMap = {
        0: '失败',
        1: '成功',
        2: '运行中',
        3: '已撤销',
        4: '重试中',
        'failed': '失败',
        'success': '成功',
        'running': '运行中',
        'canceled': '已取消',
        'revoked': '已撤销',
        'retry': '重试中'
      }
      return statusMap[status] || status
    }

    // 根据状态获取标签类型
    const getStatusTagType = (status) => {
      // 确保处理整数和字符串两种情况
      const statusInt = typeof status === 'number' ? status : {
        'running': 2,
        'success': 1,
        'failed': 0,
        'canceled': 3,
        'revoked': 3,
        'retry': 4
      }[status]
      
      switch (statusInt) {
      case 2:
        return 'primary'
      case 1:
        return 'success'
      case 0:
        return 'danger'
      case 3:
        return 'warning'
      case 4:
        return 'info'
      default:
        return 'default'
      }
    }

    // 计算任务执行耗时
    const calculateDuration = (startTime, endTime) => {
      if (!startTime || !endTime) return ''
      const start = new Date(startTime)
      const end = new Date(endTime)
      const duration = (end - start) / 1000
      return duration.toFixed(2)
    }

    // 取消正在运行的任务
    const cancelTask = async (row) => {
      try {
        // 弹出确认对话框
        await ElMessageBox.confirm(
          '确定要取消该任务吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        // 调用revokeTask API
        await revokeTask(row.task_id)
        ElMessage.success('任务取消成功')
        loadLogs()
      } catch (error) {
        // 如果用户取消确认，不显示错误消息
        if (error.name !== 'cancel') {
          console.error('取消任务失败:', error)
          ElMessage.error('取消任务失败')
        }
      }
    }

    // 刷新日志数据
    const refreshLogs = () => {
      loadLogs()
    }
    
    // 定时器，用于自动刷新运行中的任务状态
    const refreshInterval = ref(null)

    // 开始自动刷新（如果有运行中的任务）
    const startAutoRefresh = () => {
      // 如果已经有定时器，先清除
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }
      // 每5秒自动刷新一次
      refreshInterval.value = setInterval(() => {
        loadLogs()
      }, 5000)
    }

    // 停止自动刷新
    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    // 加载日志数据
    const loadLogs = async () => {
      loading.value = true
      try {
        // 状态字符串到整数的映射
        const statusMap = {
          'running': 2,
          'success': 1,
          'failed': 0,
          'canceled': 3,
          'revoked': 3,
          'retry': 4
        }
            
        // 创建基础参数
        const baseParams = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          content: searchForm.content || undefined,
          level: searchForm.level || undefined,
          // 将字符串状态值转换为整数状态值，如果没有匹配则使用原始值
          status: searchForm.status ? (statusMap[searchForm.status] || searchForm.status) : undefined
        }
            
        // 添加时间范围参数
        if (dateRange.value && dateRange.value.length === 2) {
          baseParams.start_time = dateRange.value[0]
          baseParams.end_time = dateRange.value[1]
        }
            
        // 构建最终的请求参数
        let requestParams = { ...baseParams }
            
        // 如果不是全量搜索模式且有任务ID，则添加任务ID参数
        if (!window.__searchAllLogsMode && props.taskId) {
          // 后端使用periodic_task字段进行过滤，而不是task_id
          requestParams.periodic_task = props.taskId
                  }
            
        // 使用getTaskLogs API函数，确保使用正确的接口和错误处理
        const result = await getTaskLogs(requestParams)
                    
        // 如果没有找到日志且不是全量搜索模式，提供更明确的提示
        if (!result.results || result.results.length === 0 && !window.__searchAllLogsMode) {
          console.warn('未找到当前任务的日志，可尝试点击"尝试搜索所有日按钮')
        }
            
        // 格式化日志数- 使用后端实际返回的字段名
        logData.value = result.results || []
        pagination.total = result.count || 0

        // 检查是否有运行中的任务，如果有则开启自动刷新
        const hasRunningTasks = logData.value.some(log => log.status === 'running')
        if (hasRunningTasks && !refreshInterval.value) {
          startAutoRefresh()
        } else if (!hasRunningTasks && refreshInterval.value) {
          stopAutoRefresh()
        }
            
      } catch (error) {
        console.error('获取任务日志失败:', error)
        // 显示更详细的错误信息
        if (error.response && error.response.data) {
          console.error('错误详情:', error.response.data)
          if (error.response.data.detail) {
            ElMessage.error(error.response.data.detail)
          } else if (error.response.data.message) {
            ElMessage.error(error.response.data.message)
          } else {
            ElMessage.error('获取任务日志失败')
          }
        } else {
          ElMessage.error('获取任务日志失败')
        }
            
        // 清空日志数据
        logData.value = []
        pagination.total = 0
      } finally {
        loading.value = false
        // 加载完成后滚动到最新日志
        scrollToLatestLog()
      }
    }
    
    // 格式化日志数据已不再需要，因为直接使用后端返回的字典型数据
    // 格式化日志消息显示
    const formatLogMessage = (message) => {
      if (!message) return ''
      
      // 将换行符转换为<br>
      let formattedMessage = message.replace(/\n/g, '<br>')
      
      // 对JSON格式的字符串进行语法高亮（简单版）
      if (message.includes('{') || message.includes('[')) {
        formattedMessage = formattedMessage
          .replace(/"(.*)":/g, '<span class="json-key">"$1":</span>')
          .replace(/:"(.*)"/g, ':<span class="json-string">"$1"</span>')
          .replace(/:\s*([0-9]+)/g, ':<span class="json-number">$1</span>')
          .replace(/:\s*(true|false)/g, ':<span class="json-boolean">$1</span>')
      }
      
      return formattedMessage
    }
    
    // 搜索日志
    const searchLogs = () => {
      pagination.currentPage = 1
      loadLogs()
    }
    
    // 重置搜索条件
    const resetSearch = () => {
      searchForm.content = ''
      searchForm.level = ''
      searchForm.status = ''
      dateRange.value = []
      pagination.currentPage = 1
      pagination.pageSize = 20
      resetSearchMode()
    }
    
    // 搜索所有日志（不使用任务ID过滤）
    const searchAllLogs = () => {
      window.__searchAllLogsMode = true
      pagination.currentPage = 1
      ElMessage.info('正在搜索所有日志，请稍..')
      loadLogs()
    }
    
    // 重置全量搜索模式
    const resetSearchMode = () => {
      if (window.__searchAllLogsMode) {
        window.__searchAllLogsMode = false
      }
    }
    
    // 显示完整异常信息
    const showFullTraceback = (traceback) => {
      currentTraceback.value = traceback
      showTracebackDialog.value = true
    }
    
    // 分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadLogs()
    }
    
    // 当前页变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadLogs()
    }
    
    // 关闭对话框
    const handleClose = () => {
      dialogVisible.value = false
      // 停止自动刷新
      stopAutoRefresh()
      // 重置搜索模式
      resetSearchMode()
      // 触发close事件
      emit('close')
    }

    // 组件卸载时清理定时器
    onUnmounted(() => {
      stopAutoRefresh()
    })

    // 处理行点击事件
    const handleRowClick = (row) => {
      // 如果需要点击行时进行一些操作，可以在这里添加
    }
    
    return {
      dialogVisible,
      loading,
      logData,
      showTracebackDialog,
      currentTraceback,
      searchForm,
      dateRange,
      pagination,
      logTableRef,
      autoScrollEnabled,
      open,
      loadLogs,
      formatLogMessage,
      searchLogs,
      resetSearch,
      searchAllLogs,
      showFullTraceback,
      handleSizeChange,
      handleCurrentChange,
      handleClose,
      handleRowClick,
      getStatusTagType,
      getStatusDisplay,
      calculateDuration,
      cancelTask,
      refreshLogs,
      scrollToLatestLog,
      resetSearchMode
    }
  }
}
</script>

<style scoped>
.log-viewer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-filter-section {
  padding: 10px 0;
  border-bottom: 1px solid #e4e7ed;
}

.log-content-section {
  flex: 1;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.pagination-container {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.no-logs-tip {
  margin-top: 50px;
  text-align: center;
}

/* 日志级别样式 */
.log-level {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
}

.level-debug {
  background-color: #67c23a;
}

.level-info {
  background-color: #1890ff;
}

.level-warning {
  background-color: #e6a23c;
}

.level-error {
  background-color: #f56c6c;
}

.level-critical {
  background-color: #909399;
}

/* 日志消息样式 */
.log-message {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* JSON语法高亮样式 */
.json-key {
  color: #922b21;
  font-weight: bold;
}

.json-string {
  color: #27ae60;
}

.json-number {
  color: #2874a6;
}

.json-boolean {
  color: #8e44ad;
}

/* 异常信息样式 */
.traceback-container {
  color: #f56c6c;
  font-size: 12px;
}

.traceback-content {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #f56c6c;
}

/* 状态标签样*/
.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 日志结果内容样式 */
.log-result-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 任务ID信息样式 */
.task-id-info {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

/* 为运行中的任务添加特殊样*/
.el-tag--primary {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* 表格行悬停样式优*/
.el-table__row:hover {
  background-color: #f5f7fa !important;
}
</style>