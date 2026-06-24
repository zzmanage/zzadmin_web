<!--
WorkflowDesigner.vue
====================
此文件已重构，请使用新的目录结构：

- WorkflowDesigner/index.vue - 主组件
- WorkflowDesigner/PropertyPanel.vue - 属性面板
- composables/useBpmnDesigner.js - 组合式函数

此文件保留作为向后兼容。
-->
<template>
  <WorkflowDesignerIndex v-bind="$props" v-on="$attrs" @saved="$emit('saved')" />
</template>

<script setup>
import WorkflowDesignerIndex from './WorkflowDesigner/index.vue'

defineProps({
  workflowId: {
    type: [Number, String],
    default: null
  }
})

defineEmits(['saved'])
</script>
