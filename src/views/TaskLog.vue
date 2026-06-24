<template>
  <div class="task-log-container">
    <div class="header">
      <h1>任务日志</h1>
    </div>
    
    <el-card class="search-container">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.task_name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="searchForm.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="成功" value="1" />
            <el-option label="失败" value="0" />
            <el-option label="运行" value="2" />
            <el-option label="已撤销" value="3" />
            <el-option label="重试" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="['00:00:00', '23:59:59']"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table border
      v-loading="loading"
      :data="logList"
      style="width: 100%"
    >
      <el-table-column prop="id" label="日志ID" width="80" />
      <el-table-column prop="task_id" label="任务ID" width="80" />
      <el-table-column prop="task_name" label="任务名称" />
      <el-table-column prop="execute_time" label="执行时间" width="180" />
      <el-table-column prop="duration" label="执行耗时(ms)" width="120" />
      <el-table-column prop="status" label="执行状态" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 1" type="success">成功</el-tag>
              <el-tag v-else-if="scope.row.status === 0" type="danger">失败</el-tag>
              <el-tag v-else-if="scope.row.status === 2" type="default">运行</el-tag>
              <el-tag v-else-if="scope.row.status === 3" type="warning">已撤销</el-tag>
              <el-tag v-else-if="scope.row.status === 4" type="info">重试</el-tag>
            </template>
          </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button @click="handleViewDetail(scope.row)" type="primary" size="small">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 任务日志详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="任务日志详情"
      width="70%"
      append-to-body
    >
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions bordered :column="{xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1}">
          <el-descriptions-item label="任务名称">{{ selectedLog.task_name }}</el-descriptions-item>
          <el-descriptions-item label="任务ID">{{ selectedLog.task_id }}</el-descriptions-item>
          <el-descriptions-item label="日志ID">{{ selectedLog.id }}</el-descriptions-item>
          <el-descriptions-item label="执行时间">{{ selectedLog.execute_time }}</el-descriptions-item>
          <el-descriptions-item label="执行耗时">{{ selectedLog.duration }} ms</el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag v-if="selectedLog.status === 1" type="success">成功</el-tag>
            <el-tag v-else-if="selectedLog.status === 0" type="danger">失败</el-tag>
            <el-tag v-else-if="selectedLog.status === 2" type="default">运行</el-tag>
            <el-tag v-else-if="selectedLog.status === 3" type="warning">已撤销</el-tag>
            <el-tag v-else-if="selectedLog.status === 4" type="info">重试</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="执行参数">{{ selectedLog.params || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行结果" v-if="selectedLog.result">
            <pre class="result-content">{{ selectedLog.result }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="错误信息" v-if="selectedLog.error_message && selectedLog.status === 0">
            <pre class="error-content">{{ selectedLog.error_message }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTaskLogs } from '../api/task'

export default {
  name: 'TaskLog',
  setup() {
    const loading = ref(false)
    const detailDialogVisible = ref(false)
    const selectedLog = ref(null)
    const logList = ref([])
    
    const searchForm = reactive({
      task_name: '',
      status: '',
      time_range: []
    })
    
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 获取任务日志列表
    const loadTaskLogs = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          task_name: searchForm.task_name,
          status: searchForm.status,
          start_time: searchForm.time_range && searchForm.time_range.length > 0 ? searchForm.time_range[0] : '',
          end_time: searchForm.time_range && searchForm.time_range.length > 0 ? searchForm.time_range[1] : ''
        }
        const res = await getTaskLogs(params)
        logList.value = res.results || []
        pagination.total = res.count || 0
      } catch (error) {
        ElMessage.error('获取任务日志列表失败')
        console.error('获取任务日志列表失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 查询
    const handleSearch = () => {
      pagination.currentPage = 1
      loadTaskLogs()
    }
    
    // 重置
    const handleReset = () => {
      searchForm.task_name = ''
      searchForm.status = ''
      searchForm.time_range = []
      pagination.currentPage = 1
      loadTaskLogs()
    }
    
    // 查看详情
    const handleViewDetail = (row) => {
      selectedLog.value = { ...row }
      detailDialogVisible.value = true
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadTaskLogs()
    }
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadTaskLogs()
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadTaskLogs()
    })
    
    return {
      loading,
      detailDialogVisible,
      selectedLog,
      logList,
      searchForm,
      pagination,
      handleSearch,
      handleReset,
      handleViewDetail,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.task-log-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.log-detail {
  max-height: 600px;
  overflow-y: auto;
}

.result-content,
.error-content {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-content {
  color: #f56c6c;
}
</style>