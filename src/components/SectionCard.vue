<template>
  <el-card :class="['section-card', `section-card-${type}`]">
    <template #header>
      <div class="section-card-header">
        <component v-if="icon" :is="icon" class="section-card-icon" />
        <span class="section-card-title">{{ title }}</span>
      </div>
    </template>
    <slot></slot>
  </el-card>
</template>

<script>
export default {
  name: 'SectionCard',
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
.section-card {
  margin-bottom: 20px;
}

.section-card-header {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.section-card-icon {
  margin-right: 8px;
  font-size: 18px;
}

.section-card-title {
  font-size: 16px;
}

.section-card-warning {
  border-top: 3px solid #faad14;
}
</style>