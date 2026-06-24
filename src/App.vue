<script>
import { defineComponent, onMounted } from 'vue'
import { useUserStore } from './store/user'

export default defineComponent({
  name: 'App',
  setup() {
    // 在组件的setup函数中安全地使用Pinia store
    const userStore = useUserStore()
    
    // 在组件挂载后加载用户信息
    onMounted(() => {
            userStore.loadUserInfo()
    })
    
    return {}
  },
})
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* 确保路由视图充满高度 */
.router-view {
  height: 100%;
}
</style>
