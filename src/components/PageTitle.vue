<template>
  <div class="page-title">
    <el-icon v-if="icon"><component :is="icon" /></el-icon>
    <h2 v-if="title">{{ title }}</h2>
  </div>
</template>

<script>
export default {
  name: 'PageTitle',
  props: {
    icon: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6e6e6;
}

.page-title el-icon {
  margin-right: 10px;
  font-size: 20px;
  color: #409eff;
}

.page-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}
</style>