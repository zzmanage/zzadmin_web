import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import * as AntDesignIcons from '@ant-design/icons-vue'
import { useUserStore } from './store/user'
import { useAppStore } from './store/app'
import { isAuthenticated } from './utils/auth'
import { getSessionStorage } from './utils/common/storage-utils'

// 创建应用实例
const app = createApp(App)

// 创建Pinia实例
const pinia = createPinia()

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册Ant Design图标
for (const [key, component] of Object.entries(AntDesignIcons)) {
  app.component(`Ant${key}`, component)
}

// 使用插件
app.use(ElementPlus, { size: 'default', zIndex: 3000 })
app.use(router)
app.use(pinia)

// 挂载应用
app.mount('#app')

// 挂载后初始化网站设置
setTimeout(() => {
  const appStore = useAppStore()
  const siteSettings = appStore.getSiteSettings()
  
  if (siteSettings && siteSettings.siteName) {
    document.title = siteSettings.siteName
  } else {
    document.title = 'zzadmin管理系统'
  }
  
  appStore.initTheme()
}, 200)

// 挂载后检查和确保用户认证状态
setTimeout(() => {
  const userStore = useUserStore()
  
  if (getSessionStorage('token') && !userStore.isAuthenticated) {
    userStore.loadUserInfo()
  }
  
  window.__authDebug = {
    checkAuth: () => {
      return isAuthenticated()
    },
    reloadUser: () => {
      const userStore = useUserStore()
      return userStore.loadUserInfo()
    }
  }
}, 1000)