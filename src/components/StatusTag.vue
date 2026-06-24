<template>
  <el-tag
    :type="tagType"
    :color="color"
    :effect="effect"
    :disable-transitions="disableTransitions"
    :hit="hit"
    :closable="closable"
    :size="size"
    @close="handleClose"
  >
    <slot>
      {{ statusText }}
    </slot>
  </el-tag>
</template>

<script>
export default {
  name: 'StatusTag',
  props: {
    // 状态
    status: {
      type: [Number, Boolean, String],
      required: true
    },
    // 状态映射配置，格式：{key: {text: '文本', type: '标签类型', color: '颜色'}}
    statusMap: {
      type: Object,
      default: () => ({
        // 默认映射，可被覆        ? 1 : { text: '启用', type: 'success' },
        0: { text: '禁用', type: 'danger' },
        true: { text: '启用', type: 'success' },
        false: { text: '禁用', type: 'danger' }
      })
    },
    // 标签类型，优先级高于statusMap中的配置
    type: {
      type: String,
      default: ''
    },
    // 颜色，优先级高于statusMap中的配置
    color: {
      type: String,
      default: ''
    },
    // 是否禁用标签过渡动画
    disableTransitions: {
      type: Boolean,
      default: false
    },
    // 是否有边框描边
    hit: {
      type: Boolean,
      default: false
    },
    // 是否可关闭
    closable: {
      type: Boolean,
      default: false
    },
    // 标签尺寸
    size: {
      type: String,
      default: 'default',
      validator: (value) => ['large', 'default', 'small'].includes(value)
    },
    // 主题类型
    effect: {
      type: String,
      default: 'light',
      validator: (value) => ['dark', 'light', 'plain'].includes(value)
    }
  },
  computed: {
    // 获取状态对应的配置
    statusConfig() {
      // 处理status为undefined或null的情况
      const statusKey = this.status === undefined || this.status === null  ? '' : this.status.toString()
      return this.statusMap[statusKey] || this.statusMap[this.status] || {}
    },
    // 获取标签文本
    statusText() {
      // 当状态为undefined或null时，显示友好未知状态文本
      if (this.status === undefined || this.status === null) {
        return '未知状态'
      }
      return this.statusConfig.text || String(this.status)
    },
    // 获取标签类型
    tagType() {
      return this.type || this.statusConfig.type || ''
    }
  },
  methods: {
    // 关闭标签时触发
    handleClose() {
      this.$emit('close', this.status)
    }
  }
}
</script>

<style scoped>
/* 可根据需要添加自定义样式 */
</style>