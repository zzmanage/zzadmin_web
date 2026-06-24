<template>
  <el-card :class="['stat-card', `stat-card-${type}`]">
    <div class="stat-card-header">
      <component v-if="icon" :is="icon" class="stat-card-icon" />
      <span class="stat-card-title">{{ title }}</span>
    </div>
    <div class="stat-card-content">
      <slot></slot>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    title: {
      type: String,
      required: true
    },
    icon: {
      type: Object,
      default: null
    },
    type: {
      type: String,
      default: 'default',
      validator: value => ['default', 'primary', 'success', 'warning', 'danger'].includes(value)
    }
  }
}
</script>

<style scoped>
.stat-card {
  margin-bottom: 16px;
  padding: 16px;
  height: 100%;
}

.stat-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.stat-card-icon {
  margin-right: 8px;
  font-size: 16px;
}

.stat-card-title {
  font-weight: 500;
}

.stat-card-content {
  width: 100%;
}

.stat-card-warning {
  border-left: 3px solid #faad14;
}
</style>