<template>
  <div class="task-center-container">
    <div class="page-header">
      <h1>任务中心</h1>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon pending-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon processing-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.processing }}</div>
          <div class="stat-label">处理中</div>
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
        <div class="stat-icon unassigned-icon">
          <el-icon><Users /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.unassigned }}</div>
          <div class="stat-label">未分配</div>
        </div>
      </div>
    </div>

    <div class="filter-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待处理" name="pending"></el-tab-pane>
        <el-tab-pane label="我的任务" name="my"></el-tab-pane>
        <el-tab-pane label="未分配" name="unassigned"></el-tab-pane>
        <el-tab-pane label="全部任务" name="all"></el-tab-pane>
      </el-tabs>
    </div>

    <el-table :data="taskList" style="width: 100%" v-loading="loading">
      <template #empty>
        <div style="padding: 40px; text-align: center;">
          <el-empty description="暂无任务数据"></el-empty>
        </div>
      </template>
      <el-table-column prop="workflow_name" label="流程名称" min-width="180" />
      <el-table-column prop="task_name" label="任务名称" width="150" />
      <el-table-column prop="assignee_name" label="处理人" width="120">
        <template #default="scope">
          <span v-if="scope.row.assignee_name">{{ scope.row.assignee_name }}</span>
          <span v-else class="text-gray">未分配</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getTaskStatusType(scope.row.status)">
            {{ getTaskStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at_str" label="创建时间" width="180" />
      <el-table-column prop="due_date_str" label="截止时间" width="180" />
      <el-table-column label="操作" min-width="180" fixed="right">
        <template #default="scope">
          <div class="action-buttons">
            <el-button size="small" @click="viewTaskDetail(scope.row)">详情</el-button>
            
            <!-- 根据 assignee 字段显示操作按钮 -->
            <el-button 
              v-if="!scope.row.assignee" 
              size="small" 
              type="primary" 
              @click="claimTask(scope.row)"
            >
              认领
            </el-button>
            <el-button 
              v-if="scope.row.assignee && scope.row.status !== 2 && scope.row.status !== 3" 
              size="small" 
              type="success" 
              @click="showCompleteModal(scope.row)"
            >
              完成
            </el-button>
            
            <!-- 下拉菜单 -->
            <el-dropdown trigger="click" v-if="scope.row.assignee && scope.row.status !== 2 && scope.row.status !== 3">
              <el-button size="small">
                更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="showRejectModal(scope.row)">
                    拒绝
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="任务详情" v-model="showDetailModal" width="700px">
      <div class="detail-content" v-if="selectedTask">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="流程名称">{{ selectedTask.workflow_name }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ selectedTask.task_name }}</el-descriptions-item>
          <el-descriptions-item label="处理人">
            <span v-if="selectedTask.assignee_name">{{ selectedTask.assignee_name }}</span>
            <span v-else class="text-gray">未分配</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getTaskStatusType(selectedTask.status)">
              {{ getTaskStatusText(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedTask.created_at_str }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ selectedTask.due_date_str || '-' }}</el-descriptions-item>
          <el-descriptions-item label="流程实例ID">{{ selectedTask.instance_id }}</el-descriptions-item>
          <el-descriptions-item label="任务ID">{{ selectedTask.id }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 20px;">
          <el-form-item label="任务描述">
            <el-input :value="selectedTask.description" type="textarea" :rows="3" readonly />
          </el-form-item>
        </div>
        <div v-if="taskTransitions.length > 0" style="margin-top: 20px;">
          <h3>流转历史</h3>
          <div class="timeline">
            <div 
              v-for="(transition, index) in taskTransitions" 
              :key="index" 
              class="timeline-item"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-title">{{ transition.action }}</div>
                <div class="timeline-time">{{ transition.created_at }}</div>
                <div class="timeline-user">操作人：{{ transition.operator }}</div>
                <div v-if="transition.comment" class="timeline-comment">备注：{{ transition.comment }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog title="完成任务" v-model="showCompleteModalVisible" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="处理意见" prop="comment">
          <el-input 
            v-model="completeForm.comment" 
            placeholder="请输入处理意见"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteModalVisible = false">取消</el-button>
        <el-button type="primary" @click="completeTask">确认完成</el-button>
      </template>
    </el-dialog>

    <el-dialog title="拒绝任务" v-model="showRejectModalVisible" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="拒绝原因" prop="comment">
          <el-input 
            v-model="rejectForm.comment" 
            placeholder="请输入拒绝原因"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectModalVisible = false">取消</el-button>
        <el-button type="danger" @click="rejectTask">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  getWorkflowTaskList,
  getPendingWorkflowTasks,
  getMyWorkflowTasks,
  getUnassignedWorkflowTasks,
  claimWorkflowTask,
  completeWorkflowTask,
  rejectWorkflowTask,
  getWorkflowTransitionsByTask
} from '../api/workflow'

const taskList = ref([])
const loading = ref(false)
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const activeTab = ref('pending')
const stats = reactive({
  pending: 0,
  processing: 0,
  completed: 0,
  unassigned: 0,
  total: 0
})

const showDetailModal = ref(false)
const showCompleteModalVisible = ref(false)
const showRejectModalVisible = ref(false)
const selectedTask = ref(null)
const taskTransitions = ref([])

const completeForm = reactive({
  comment: ''
})

const rejectForm = reactive({
  comment: ''
})

// 后端状态码: 0=待处理, 1=处理中, 2=已完成, 3=已拒绝
const getTaskStatusType = (status) => {
  const types = {
    0: 'warning',    // 待处理
    1: 'info',      // 处理中
    2: 'success',   // 已完成
    3: 'danger'     // 已拒绝
  }
  return types[status] || 'info'
}

const getTaskStatusText = (status) => {
  const texts = {
    0: '待处理',
    1: '处理中',
    2: '已完成',
    3: '已拒绝'
  }
  return texts[status] || status
}

const loadTasks = async () => {
  loading.value = true
  try {
    let response
    switch (activeTab.value) {
      case 'pending':
        response = await getPendingWorkflowTasks()
        break
      case 'my':
        response = await getMyWorkflowTasks()
        break
      case 'unassigned':
        response = await getUnassignedWorkflowTasks()
        break
      default:
        response = await getWorkflowTaskList()
    }
    // 处理分页数据
    taskList.value = response.data.results || response.data || []
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const [pendingRes, myRes, unassignedRes, allRes] = await Promise.all([
      getPendingWorkflowTasks(),
      getMyWorkflowTasks(),
      getUnassignedWorkflowTasks(),
      getWorkflowTaskList()
    ])
    // 处理分页数据
    const pendingData = pendingRes.data.results || pendingRes.data || []
    const myData = myRes.data.results || myRes.data || []
    const unassignedData = unassignedRes.data.results || unassignedRes.data || []
    const allData = allRes.data.results || allRes.data || []
    
    stats.pending = pendingData.length || 0
    stats.unassigned = unassignedData.length || 0
    stats.processing = myData.filter(t => t.status === 1).length || 0
    stats.completed = allData.filter(t => t.status === 2).length || 0
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const handleTabChange = () => {
  loadTasks()
}

const viewTaskDetail = async (row) => {
  selectedTask.value = row
  try {
    const response = await getWorkflowTransitionsByTask(row.id)
    taskTransitions.value = response.data || []
  } catch (error) {
    taskTransitions.value = []
  }
  showDetailModal.value = true
}

const showCompleteModal = (row) => {
  selectedTask.value = row
  completeForm.comment = ''
  showCompleteModalVisible.value = true
}

const showRejectModal = (row) => {
  selectedTask.value = row
  rejectForm.comment = ''
  showRejectModalVisible.value = true
}

const claimTask = async (row) => {
  try {
    await claimWorkflowTask(row.id)
    ElMessage.success('任务认领成功')
    loadTasks()
    loadStats()
  } catch (error) {
    ElMessage.error('任务认领失败')
  }
}

const completeTask = async () => {
  try {
    await completeWorkflowTask(selectedTask.value.id, { comment: completeForm.comment })
    ElMessage.success('任务完成成功')
    showCompleteModalVisible.value = false
    loadTasks()
    loadStats()
  } catch (error) {
    ElMessage.error('任务完成失败')
  }
}

const rejectTask = async () => {
  if (!rejectForm.comment) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await rejectWorkflowTask(selectedTask.value.id, { comment: rejectForm.comment })
    ElMessage.success('任务拒绝成功')
    showRejectModalVisible.value = false
    loadTasks()
    loadStats()
  } catch (error) {
    ElMessage.error('任务拒绝失败')
  }
}

onMounted(() => {
  loadTasks()
  loadStats()
})
</script>

<style scoped>
.task-center-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
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

.pending-icon {
  background: #fff7e6;
  color: #fa8c16;
}

.processing-icon {
  background: #e6f7ff;
  color: #1890ff;
}

.completed-icon {
  background: #f6ffed;
  color: #52c41a;
}

.unassigned-icon {
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

.text-gray {
  color: #999;
}

.detail-content {
  padding: 10px;
}

.timeline {
  padding-left: 20px;
  border-left: 2px solid #e8e8e8;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -26px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1890ff;
}

.timeline-content {
  background: #fafafa;
  padding: 10px;
  border-radius: 4px;
}

.timeline-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.timeline-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 3px;
}

.timeline-user {
  font-size: 12px;
  color: #666;
}

.timeline-comment {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid #e8e8e8;
}
</style>