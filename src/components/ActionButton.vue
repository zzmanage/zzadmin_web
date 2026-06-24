<template>
  <el-button :type="type" @click="handleClick">
    <slot></slot>
  </el-button>
</template>

<script>
export default {
  name: 'ActionButton',
  props: {
    type: {
      type: String,
      default: 'default'
    }
  },
  methods: {
    handleClick() {
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
/* Add any specific styling for ActionButton here */
</style>