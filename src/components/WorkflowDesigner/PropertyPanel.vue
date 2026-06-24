<template>
  <div class="property-panel">
    <div class="panel-header">
      <span>属性面板</span>
    </div>

    <el-form :model="properties" label-width="100px" class="panel-form">
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>

      <el-form-item label="节点名称">
        <el-input v-model="properties.name" @blur="$emit('update-name')" placeholder="请输入节点名称" />
      </el-form-item>

      <el-form-item label="节点ID">
        <el-input v-model="properties.id" disabled />
      </el-form-item>

      <el-form-item label="节点类型">
        <el-tag size="small">{{ typeLabel }}</el-tag>
      </el-form-item>

      <!-- 审批人配置（仅任务节点显示） -->
      <template v-if="isTaskNode">
        <el-divider content-position="left">审批人配置</el-divider>

        <el-form-item label="分配方式">
          <el-radio-group
            v-model="properties.assigneeType"
            @change="$emit('assignee-type-change')"
          >
            <el-radio label="specific">指定审批人</el-radio>
            <el-radio label="role">指定角色</el-radio>
            <el-radio label="initiator">发起人</el-radio>
            <el-radio label="expression">表达式</el-radio>
            <el-radio label="relation">关系</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 指定审批人 -->
        <el-form-item label="审批人" v-if="properties.assigneeType === 'specific'">
          <el-select
            v-model="properties.candidateUsers"
            multiple
            placeholder="选择审批人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username"
              :value="user.id.toString()"
            />
          </el-select>
        </el-form-item>

        <!-- 指定角色 -->
        <el-form-item label="角色" v-if="properties.assigneeType === 'role'">
          <el-select
            v-model="properties.candidateRoles"
            multiple
            placeholder="选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id.toString()"
            />
          </el-select>
        </el-form-item>

        <!-- 表达式 -->
        <el-form-item label="表达式" v-if="properties.assigneeType === 'expression'">
          <el-input
            v-model="properties.assigneeExpression"
            placeholder="${user:1} 或 ${role:manager}"
          />
          <div class="help-text">
            格式: ${user:用户ID} 或 ${role:角色编码}
          </div>
        </el-form-item>

        <!-- 关系 -->
        <el-form-item label="关系" v-if="properties.assigneeType === 'relation'">
          <el-select v-model="properties.assigneeRelation" placeholder="选择关系" style="width: 100%">
            <el-option label="直属上级 (supervisor)" value="supervisor" />
            <el-option label="部门主管 (department_head)" value="department_head" />
            <el-option label="经理 (manager)" value="manager" />
            <el-option label="副职 (deputy)" value="deputy" />
            <el-option label="上一审批人 (last_approver)" value="last_approver" />
          </el-select>
        </el-form-item>

        <!-- 分配策略（多审批人时显示） -->
        <el-form-item
          label="分配策略"
          v-if="
            (properties.candidateUsers && properties.candidateUsers.length > 1) ||
            (properties.candidateRoles && properties.candidateRoles.length > 1)
          "
        >
          <el-select v-model="properties.assignmentStrategy" placeholder="选择分配策略" style="width: 100%">
            <el-option label="任意一人审批即可（ANYONE）" value="ANYONE" />
            <el-option label="全员审批通过（CONSENSUS）" value="CONSENSUS" />
            <el-option label="轮询分配（ROUND_ROBIN）" value="ROUND_ROBIN" />
            <el-option label="按比例通过（QUORUM）" value="QUORUM" />
          </el-select>
        </el-form-item>

        <!-- 会签配置 -->
        <el-form-item label="会签模式">
          <el-select v-model="properties.multiInstanceType" placeholder="选择会签模式" style="width: 100%">
            <el-option label="并行会签（多人同时审批）" value="parallel" />
            <el-option label="串行会签（按顺序依次审批）" value="sequential" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 网关配置（仅网关节点显示） -->
      <template v-if="isGatewayNode">
        <el-divider content-position="left">网关配置</el-divider>

        <el-form-item label="网关类型">
          <el-select v-model="properties.gatewayType" placeholder="选择网关类型" style="width: 100%">
            <el-option label="排他网关（只选一条路径）" value="exclusive" />
            <el-option label="并行网关（所有路径同时执行）" value="parallel" />
            <el-option label="包容网关（满足条件的路径都执行）" value="inclusive" />
          </el-select>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  element: {
    type: Object,
    required: true
  },
  properties: {
    type: Object,
    required: true
  },
  userList: {
    type: Array,
    default: () => []
  },
  roleList: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update-name', 'assignee-type-change'])

// 计算节点类型标签
const typeLabel = computed(() => {
  const typeMap = {
    start: '开始',
    end: '结束',
    task: '任务',
    userTask: '用户任务',
    gateway: '网关'
  }
  return typeMap[props.properties.type] || '未知'
})

// 是否为任务节点
const isTaskNode = computed(() => {
  return ['task', 'userTask'].includes(props.properties.type)
})

// 是否为网关节点
const isGatewayNode = computed(() => {
  return props.properties.type === 'gateway'
})
</script>

<style scoped>
.property-panel {
  width: 280px;
  border-left: 1px solid #e4e7ed;
  background: #fff;
  overflow-y: auto;
}

.panel-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  color: #303133;
}

.panel-form {
  padding: 16px;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.el-divider--horizontal) {
  margin: 16px 0;
}

:deep(.el-radio) {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
