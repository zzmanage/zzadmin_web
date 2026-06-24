<template>
  <div class="app-container">
    <div class="main-layout">
      <aside class="left-sidebar" :class="{ 'collapsed': isCollapse }">
        <Sidebar />
      </aside>
      <main class="right-content">
        <AppHeader />
        <Breadcrumb />
        <div class="content-wrapper">
          <router-view />
        </div>
        <AppFooter />
      </main>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import AppHeader from './Header.vue'
import AppFooter from './Footer.vue'
import Breadcrumb from './Breadcrumb.vue'
import { useAppStore } from '../store/app'
import { storeToRefs } from 'pinia'

export default {
  name: 'Layout',
  components: {
    Sidebar,
    AppHeader,
    AppFooter,
    Breadcrumb
  },
  setup() {
    const appStore = useAppStore()
    const { isCollapse } = storeToRefs(appStore)
    
    const toggleSidebar = () => {
      appStore.toggleSidebar()
    }
    
    const handleResize = () => {
      const width = window.innerWidth
      
      if (width < 768) {
        appStore.collapseSidebar(true)
      } else {
        appStore.collapseSidebar(false)
      }
    }

    onMounted(() => {
      handleResize()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      toggleSidebar,
      isCollapse
    }
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-sidebar {
  height: 100%;
  width: 200px;
  transition: all 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.left-sidebar.collapsed {
  width: 60px;
}

.left-sidebar::-webkit-scrollbar {
  width: 4px;
}

.left-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.left-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.left-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}

@media screen and (max-width: 768px) {
  .content-wrapper {
    padding: 10px;
  }
}
</style>