<template>
  <div class="workflow-container">
    <div class="page-header">
      <h1>工作流管理</h1>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="openDesigner()"
        >
          <el-icon><Plus /></el-icon>
          创建工作流
        </el-button>
      </div>
    </div>
    
    <el-table :data="workflowList" style="width: 100%" v-loading="loading">
      <template #empty>
        <div style="padding: 40px; text-align: center;">
          <el-empty description="暂无工作流数据"></el-empty>
          <el-button type="primary" style="margin-top: 20px;" @click="openDesigner()">
            创建第一个工作流
          </el-button>
        </div>
      </template>
      <el-table-column prop="name" label="工作流名称" min-width="200" />
      <el-table-column prop="code" label="流程编码" width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" fixed="right">
        <template #default="scope">
          <div class="action-buttons">
            <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
            <el-button size="small" type="primary" @click="openDesigner(scope.row)">编辑</el-button>
            
            <el-dropdown trigger="click">
              <el-button size="small">
                更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-item @click="toggleStatus(scope.row)">
                  {{ scope.row.status === 1 ? '禁用' : '启用' }}
                </el-dropdown-item>
                <el-dropdown-item divided @click="deleteWorkflow(scope.row)">
                  删除
                </el-dropdown-item>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 使用WorkflowDesigner组件 -->
    <el-dialog 
      title="工作流设计" 
      v-model="showDesigner" 
      width="90%"
      :fullscreen="true"
    >
      <WorkflowDesigner 
        :workflow-id="editingWorkflowId" 
        @saved="handleDesignerSaved"
      />
    </el-dialog>
    
    <el-dialog title="工作流详情" v-model="showDetail" width="700px">
      <div class="detail-content" v-if="selectedWorkflow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工作流名称">{{ selectedWorkflow.name }}</el-descriptions-item>
          <el-descriptions-item label="流程编码">{{ selectedWorkflow.code }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedWorkflow.status === 1 ? 'success' : 'warning'">
              {{ selectedWorkflow.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述">{{ selectedWorkflow.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedWorkflow.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedWorkflow.updated_at) }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 20px;">
          <el-form-item label="流程定义">
            <el-input :value="selectedWorkflow.flow_json ? JSON.stringify(selectedWorkflow.flow_json, null, 2) : ''" type="textarea" :rows="6" readonly />
          </el-form-item>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Plus } from '@element-plus/icons-vue'
import { formatDate } from '../utils/common/date-utils'
import WorkflowDesigner from '../components/WorkflowDesigner.vue'
import {
  getWorkflowDefinitionList,
  deleteWorkflowDefinition,
  toggleWorkflowStatus,
  getWorkflowDefinitionById
} from '../api/workflow'

const workflowList = ref([])
const loading = ref(false)
const showDesigner = ref(false)
const showDetail = ref(false)
const selectedWorkflow = ref(null)
const editingWorkflowId = ref(null)

const loadWorkflows = async () => {
  loading.value = true
  try {
    const response = await getWorkflowDefinitionList()
    workflowList.value = response.data.results || response.data || []
  } catch (error) {
    ElMessage.error('加载工作流列表失败')
  } finally {
    loading.value = false
  }
}

const viewDetail = async (row) => {
  try {
    const response = await getWorkflowDefinitionById(row.id)
    selectedWorkflow.value = response.data.data || response.data
    showDetail.value = true
  } catch (error) {
    ElMessage.error('获取工作流详情失败')
  }
}

const openDesigner = (row = null) => {
  editingWorkflowId.value = row?.id || null
  showDesigner.value = true
}

const handleDesignerSaved = () => {
  showDesigner.value = false
  editingWorkflowId.value = null
  loadWorkflows()
}

const toggleStatus = async (row) => {
  try {
    await toggleWorkflowStatus(row.id)
    ElMessage.success('状态切换成功')
    loadWorkflows()
  } catch (error) {
    ElMessage.error('状态切换失败')
  }
}

const deleteWorkflow = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除工作流"${row.name}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteWorkflowDefinition(row.id)
    ElMessage.success('删除成功')
    loadWorkflows()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadWorkflows()
})
</script>

<style scoped>
.workflow-container {
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

.action-buttons {
  display: flex;
  gap: 5px;
}

.detail-content {
  padding: 10px;
}
</style>