<template>
  <div class="workflow-instance-container">
    <div class="page-header">
      <h1>流程实例管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showStartModal = true">
          <el-icon><Plus /></el-icon>
          启动流程
        </el-button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon all-icon">
          <el-icon><Grid /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">全部实例</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon running-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.running }}</div>
          <div class="stat-label">运行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon my-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.myInstances }}</div>
          <div class="stat-label">我发起的</div>
        </div>
      </div>
    </div>

    <div class="filter-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
        <el-tab-pane label="运行中" name="running"></el-tab-pane>
        <el-tab-pane label="已完成" name="completed"></el-tab-pane>
        <el-tab-pane label="我发起的" name="my"></el-tab-pane>
      </el-tabs>
    </div>

    <el-table :data="instanceList" style="width: 100%" v-loading="loading">
      <template #empty>
        <div style="padding: 40px; text-align: center;">
          <el-empty description="暂无流程实例数据"></el-empty>
        </div>
      </template>
      <el-table-column prop="workflow_name" label="流程名称" min-width="200" />
      <el-table-column prop="business_key" label="业务标识" width="150" />
      <el-table-column prop="status_text" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status_text)">
            {{ scope.row.status_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="创建人" width="120" />
      <el-table-column prop="created_at_str" label="创建时间" width="180" />
      <el-table-column prop="updated_at_str" label="更新时间" width="180" />
      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="scope">
          <div class="action-buttons">
            <el-button size="small" @click="viewInstance(scope.row)">详情</el-button>
            <el-button 
              v-if="scope.row.status_text === 'RUNNING'" 
              size="small" 
              type="primary" 
              @click="completeInstance(scope.row)"
            >
              完成流程
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination" style="text-align: center; margin-top: 20px;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </div>

    <el-dialog title="启动流程实例" v-model="showStartModal" width="600px">
      <el-form :model="startForm" label-width="100px">
        <el-form-item label="选择流程" prop="workflow_id">
          <el-select v-model="startForm.workflow_id" placeholder="请选择流程">
            <el-option 
              v-for="wf in workflowOptions" 
              :key="wf.id" 
              :label="wf.name" 
              :value="wf.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="业务标识" prop="business_key">
          <el-input v-model="startForm.business_key" placeholder="请输入业务标识" />
        </el-form-item>
        <el-form-item label="流程数据" prop="variables">
          <el-input 
            v-model="startForm.variables" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入JSON格式的流程数据"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStartModal = false">取消</el-button>
        <el-button type="primary" @click="startInstance">启动</el-button>
      </template>
    </el-dialog>

    <el-dialog title="流程实例详情" v-model="showDetailModal" width="700px">
      <div class="detail-content" v-if="selectedInstance">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="流程名称">{{ selectedInstance.workflow_name }}</el-descriptions-item>
          <el-descriptions-item label="实例ID">{{ selectedInstance.id }}</el-descriptions-item>
          <el-descriptions-item label="业务标识">{{ selectedInstance.business_key || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedInstance.status_text)">
              {{ selectedInstance.status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedInstance.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedInstance.created_at_str }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ selectedInstance.updated_at_str }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 20px;">
          <el-form-item label="流程数据">
            <el-input :value="JSON.stringify(selectedInstance.data || {})" type="textarea" :rows="6" readonly />
          </el-form-item>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElIcon } from 'element-plus'
import { Plus, Grid, Clock, CircleCheck, User } from '@element-plus/icons-vue'
import {
  getWorkflowInstanceList,
  getRunningWorkflowInstances,
  getCompletedWorkflowInstances,
  getMyWorkflowInstances,
  startWorkflowInstance,
  completeWorkflowInstance,
  getWorkflowInstanceById,
  getActiveWorkflowDefinitions
} from '../api/workflow'

const instanceList = ref([])
const loading = ref(false)
const activeTab = ref('all')
const showStartModal = ref(false)
const showDetailModal = ref(false)
const selectedInstance = ref(null)
const workflowOptions = ref([])

// 分页相关
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

const stats = reactive({
  total: 0,
  running: 0,
  completed: 0,
  myInstances: 0
})

const startForm = reactive({
  workflow_id: '',
  business_key: '',
  variables: ''
})

const getStatusType = (statusText) => {
  const types = {
    'RUNNING': 'warning',
    'COMPLETED': 'success',
    'FAILED': 'danger',
    'SUSPENDED': 'info',
    'CREATED': 'info'
  }
  return types[statusText] || 'info'
}

const getStatusText = (statusText) => {
  return statusText || '未知'
}

const loadInstances = async () => {
  loading.value = true
  try {
    let response
    switch (activeTab.value) {
      case 'running':
        response = await getRunningWorkflowInstances()
        break
      case 'completed':
        response = await getCompletedWorkflowInstances()
        break
      case 'my':
        response = await getMyWorkflowInstances()
        break
      default:
        response = await getWorkflowInstanceList({
          page: currentPage.value,
          page_size: pageSize.value
        })
    }
    // 处理分页数据
    if (response.data.results !== undefined) {
      instanceList.value = response.data.results
      total.value = response.data.count
    } else {
      instanceList.value = response.data || []
      total.value = response.data?.length || 0
    }
  } catch (error) {
    ElMessage.error('加载流程实例失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const [allRes, runningRes, myRes] = await Promise.all([
      getWorkflowInstanceList(),
      getRunningWorkflowInstances(),
      getMyWorkflowInstances()
    ])
    
    // 处理分页数据：如果有 count 字段就使用它，否则使用数组长度
    const getAllCount = (res) => {
      if (res.data && res.data.count !== undefined) {
        return res.data.count
      }
      return res.data?.length || 0
    }
    
    stats.total = getAllCount(allRes)
    stats.running = getAllCount(runningRes)
    stats.myInstances = getAllCount(myRes)
    stats.completed = Math.max(0, stats.total - stats.running)
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const loadWorkflowOptions = async () => {
  try {
    const response = await getActiveWorkflowDefinitions()
    workflowOptions.value = response.data || []
  } catch (error) {
    console.error('加载流程选项失败', error)
  }
}

const handleTabChange = () => {
  // 切换tab时重置页码
  currentPage.value = 1
  loadInstances()
}

const handlePageSizeChange = () => {
  // 每页条数改变时重置页码
  currentPage.value = 1
  loadInstances()
}

const handleCurrentPageChange = () => {
  loadInstances()
}

const viewInstance = async (row) => {
  try {
    const response = await getWorkflowInstanceById(row.id)
    selectedInstance.value = response.data
    showDetailModal.value = true
  } catch (error) {
    ElMessage.error('获取实例详情失败')
  }
}

const startInstance = async () => {
  if (!startForm.workflow_id) {
    ElMessage.warning('请选择流程')
    return
  }
  
  try {
    const params = {
      definition_id: startForm.workflow_id,
      business_key: startForm.business_key,
      data: startForm.variables ? JSON.parse(startForm.variables) : {}
    }
    await startWorkflowInstance(params)
    ElMessage.success('流程启动成功')
    showStartModal.value = false
    startForm.workflow_id = ''
    startForm.business_key = ''
    startForm.variables = ''
    loadInstances()
    loadStats()
  } catch (error) {
    ElMessage.error('流程启动失败')
  }
}

const completeInstance = async (row) => {
  try {
    await completeWorkflowInstance(row.id)
    ElMessage.success('流程完成成功')
    loadInstances()
    loadStats()
  } catch (error) {
    ElMessage.error('流程完成失败')
  }
}

onMounted(() => {
  loadInstances()
  loadStats()
  loadWorkflowOptions()
})
</script>

<style scoped>
.workflow-instance-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
}

.all-icon {
  background: #e6f7ff;
  color: #1890ff;
}

.running-icon {
  background: #fff7e6;
  color: #fa8c16;
}

.completed-icon {
  background: #f6ffed;
  color: #52c41a;
}

.my-icon {
  background: #f9f0ff;
  color: #722ed1;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.filter-tabs {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.detail-content {
  padding: 10px;
}
</style>