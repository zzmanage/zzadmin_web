<template>
  <div class="workflow-designer">
    <!-- 头部工具栏 -->
    <div class="designer-header">
      <div class="header-left">
        <el-button type="primary" @click="showSaveModal = true">保存</el-button>
        <el-button @click="exportWorkflow">导出</el-button>
      </div>
      <div class="header-center">
        <span class="title">{{ workflowForm.name || '新建工作流' }}</span>
      </div>
      <div class="header-right">
        <el-button @click="clearDesigner">清空</el-button>
      </div>
    </div>

    <!-- 设计器主体 -->
    <div class="designer-container">
      <!-- 左侧工具栏 -->
      <div class="designer-toolbar">
        <div class="toolbar-section">
          <div class="section-title">基本元素</div>
          <div class="tool-list">
            <div class="tool-item" @click="addStartEvent" title="开始事件">
              <i class="el-icon-video-play"></i>
              <span>开始</span>
            </div>
            <div class="tool-item" @click="addEndEvent" title="结束事件">
              <i class="el-icon-video-pause"></i>
              <span>结束</span>
            </div>
            <div class="tool-item" @click="addTask" title="任务">
              <i class="el-icon-document"></i>
              <span>任务</span>
            </div>
            <div class="tool-item" @click="addUserTask" title="用户任务">
              <i class="el-icon-user"></i>
              <span>用户任务</span>
            </div>
            <div class="tool-item" @click="addGateway" title="网关">
              <i class="el-icon-connection"></i>
              <span>网关</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间画布 -->
      <div class="designer-canvas" ref="canvasRef"></div>

      <!-- 右侧属性面板 -->
      <PropertyPanel
        v-if="selectedElement"
        :element="selectedElement"
        :properties="elementProperties"
        :user-list="userList"
        :role-list="roleList"
        @update-name="updateElementName"
        @assignee-type-change="handleAssigneeTypeChange"
      />

      <!-- 空状态提示 -->
      <div v-else class="property-panel-empty">
        <el-empty description="选择节点以编辑属性" />
      </div>
    </div>

    <!-- 保存弹窗 -->
    <el-dialog v-model="showSaveModal" title="保存工作流" width="500px">
      <el-form :model="workflowForm" label-width="100px">
        <el-form-item label="工作流名称" required>
          <el-input v-model="workflowForm.name" placeholder="请输入工作流名称" />
        </el-form-item>
        <el-form-item label="工作流编码" required>
          <el-input v-model="workflowForm.code" placeholder="请输入工作流编码" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="workflowForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工作流描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveModal = false">取消</el-button>
        <el-button type="primary" @click="saveWorkflow">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useBpmnDesigner } from '@/composables/useBpmnDesigner'
import PropertyPanel from './PropertyPanel.vue'

const props = defineProps({
  workflowId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['saved'])

// 使用组合式函数
const {
  canvasRef,
  selectedElement,
  showSaveModal,
  workflowForm,
  elementProperties,
  userList,
  roleList,
  loadUsers,
  loadRoles,
  initDesigner,
  updateElementName,
  clearDesigner,
  exportWorkflow,
  saveWorkflow,
  addStartEvent,
  addEndEvent,
  addTask,
  addUserTask,
  addGateway,
  handleAssigneeTypeChange,
  destroy
} = useBpmnDesigner(props.workflowId)

// 生命周期
onMounted(async () => {
  await nextTick()
  await initDesigner()
  await loadUsers()
  await loadRoles()
})

onUnmounted(() => {
  destroy()
})

// 监听保存成功
watch(showSaveModal, (newVal) => {
  if (!newVal) {
    emit('saved')
  }
})
</script>

<style scoped>
.workflow-designer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.designer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.header-left,
.header-right {
  display: flex;
  gap: 8px;
}

.header-center .title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.designer-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.designer-toolbar {
  width: 120px;
  background: #fafafa;
  border-right: 1px solid #e4e7ed;
  padding: 12px 8px;
}

.toolbar-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  padding-left: 4px;
}

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #606266;
}

.tool-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.tool-item i {
  font-size: 16px;
}

.designer-canvas {
  flex: 1;
  background: #f5f7fa;
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;
}

.property-panel-empty {
  width: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #e4e7ed;
  background: #fff;
}
</style>
