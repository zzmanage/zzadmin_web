<template>
  <nav class="breadcrumb-wrapper" aria-label="面包屑导航">
    <el-breadcrumb 
      :separator-class="separator" 
      class="breadcrumb-container"
    >
      <!-- 首页链接 - 始终显示 -->
      <el-breadcrumb-item 
        :to="{ path: '/' }" 
        class="breadcrumb-item home-item"
        :aria-current="isHomePage  ? 'page' : false"
      >
        <span class="breadcrumb-icon home-icon"><el-icon><ant-home-outlined /></el-icon></span>
        <span>{{ homeText }}</span>
      </el-breadcrumb-item>
      
      <!-- 动态渲染面包屑-->
      <template v-for="(item, index) in breadcrumbItems" :key="item.path || index">
        <el-breadcrumb-item 
          :to="{ path: item.path }" 
          class="breadcrumb-item"
          :aria-current="index === breadcrumbItems.length - 1 && !isHomePage  ? 'page' : false"
        >
          <span v-if="item.meta.icon && showIcons" class="breadcrumb-icon"><el-icon :is="item.meta.icon" /></span>
          <span>{{ item.meta.title }}</span>
        </el-breadcrumb-item>
      </template>
    </el-breadcrumb>
  </nav>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 注意：图标已在main.js中全局注册，无需在此处导入
// 组件属性
const props = defineProps({
  // 自定义分隔符类名
  separator: {
    type: String,
    default: 'el-icon-arrow-right'
  },
  // 是否高亮当前页面
  highlightCurrent: {
    type: Boolean,
    default: true
  },
  // 首页文本
  homeText: {
    type: String,
    default: '首页'
  },
  // 是否启用图标
  showIcons: {
    type: Boolean,
    default: true
  },
  // 自定义面包屑数据（优先级高于路由生成）
  customRoutes: {
    type: Array,
    default: () => []
  }
})

const route = useRoute()
const router = useRouter()
const breadcrumbItems = ref([])
const cachedBreadcrumbs = ref(new Map()) // 用于缓存已生成的面包屑路径
// 计算是否为首页
const isHomePage = computed(() => {
  return route.path === '/' || route.path === '/dashboard'
})

// 解析路由生成面包屑
const generateBreadcrumb = () => {
  // 如果提供了自定义路由数据，则优先使用
  if (props.customRoutes.length > 0) {
    breadcrumbItems.value = props.customRoutes
    return
  }
  
  // 生成当前路由的缓存键（包含参数）
  const cacheKey = `${route.path}_${JSON.stringify(route.params)}`
  
  // 检查缓存
  if (cachedBreadcrumbs.value.has(cacheKey)) {
    breadcrumbItems.value = cachedBreadcrumbs.value.get(cacheKey)
    return
  }
  
  // 从路由匹配记录生成面包屑
  const items = []
  
  // 遍历所有路由匹配项，跳过第一个（通常是Layout）和首页路由
  for (let i = 1; i < route.matched.length; i++) {
    const record = route.matched[i]
    
    // 跳过没有标题的路由记录
    if (!record.meta || !record.meta.title) continue
    
    // 转换图标字符串为实际图标组件
    // 由于图标已在main.js中全局注册，我们可以直接使用字符串名称
    items.push({
      path: record.path,
      meta: {
        title: record.meta.title,
        icon: record.meta.icon
      }
    })
  }
  
  // 处理嵌套路由和特殊场景
  handleSpecialRoutes(items)
  
  // 缓存结果
  cachedBreadcrumbs.value.set(cacheKey, items)
  
  breadcrumbItems.value = items
}

// 处理特殊路由场景和嵌套路由
const handleSpecialRoutes = (items) => {
  // 获取当前完整路径
  const currentPath = route.path
  
  // 处理其他可能的嵌套路由场景
  // 文件管理相关路由
  if (currentPath === '/file') {
    // 检查是否需要添加父级导航
    const parentRoute = router.getRoutes().find(r => r.children && r.children.some(c => c.path === '/file'))
    if (parentRoute && parentRoute.meta && parentRoute.meta.title && 
        !items.some(item => item.path === parentRoute.path)) {
      items.unshift({
        path: parentRoute.path,
        meta: {
          title: parentRoute.meta.title,
          icon: parentRoute.meta.icon || 'Menu' // 使用路由定义的图标或默认图标名称
        }
      })
    }
  }
}

// 监听路由变化，动态更新面包屑
// 使用更精确的监听方式，确保每次路由变化都能触发更新
watch(
  () => ({ path: route.path, query: route.query, params: route.params }),
  () => {
    generateBreadcrumb()
  },
  { immediate: true, deep: true }
)

// 监听自定义路由数据变化
watch(
  () => props.customRoutes,
  () => {
    generateBreadcrumb()
  },
  { deep: true }
)

// 初始化生成面包屑
onMounted(() => {
  generateBreadcrumb()
})
</script>

<style scoped>
.breadcrumb-wrapper {
  padding: 0 20px 10px 20px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

/* 隐藏滚动条但保留功能 */
.breadcrumb-wrapper::-webkit-scrollbar {
  height: 4px;
}

.breadcrumb-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.breadcrumb-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.breadcrumb-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.breadcrumb-container {
  font-size: 14px;
  line-height: 32px;
  padding: 8px 0;
}

.breadcrumb-item {
  display: inline-flex !important;
  align-items: center;
  transition: all 0.3s ease;
}

.breadcrumb-item:hover {
  color: #409eff;
}

.breadcrumb-item a {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
  transition: color 0.3s ease;
}

.breadcrumb-item a:hover {
  color: #409eff;
}

.breadcrumb-icon {
  margin-right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 当前页面样式 */
.current-item {
  color: #606266;
  font-weight: 500;
  cursor: default;
}

.current-item:hover {
  color: #606266;
}

/* 首页图标特殊样式 */
.home-icon {
  color: #409eff;
}

/* 分隔符样式 */
.el-breadcrumb__separator {
  margin: 0 8px;
  color: #c0c4cc;
  font-size: 12px;
}

/* 响应式设*/
@media screen and (max-width: 768px) {
  .breadcrumb-wrapper {
    padding: 0 10px 8px 10px;
  }
  
  .breadcrumb-container {
    font-size: 13px;
    line-height: 28px;
    padding: 6px 0;
  }
  
  .el-breadcrumb__separator {
    margin: 0 6px;
    font-size: 11px;
  }
}

@media screen and (max-width: 480px) {
  .breadcrumb-icon {
    display: none; /* 在小屏幕上隐藏图标以节省空间 */
  }
}

/* 无障碍访问支持 */
@media (prefers-reduced-motion: reduce) {
  .breadcrumb-item {
    transition: none;
  }
  
  .breadcrumb-item a {
    transition: none;
  }
}
</style>