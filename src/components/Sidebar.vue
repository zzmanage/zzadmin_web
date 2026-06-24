<template>
  <div class="nav-side">
    <el-aside style="height: 100%;">
      <!-- 标题- 独立于菜单内-->
      <div class="sidebar-header">
        <span class="title" :class="{ 'title-collapsed': isCollapse }">{{ siteSettings.siteName }}</span>
      </div>
      
      <el-menu
        mode="vertical"
        :default-active="$route.path"
        router
        :collapse="isCollapse"
        :unique-opened="false"
        @select="handleSelect"
        class="el-menu-vertical-demo"
        @open="handleOpen"
        @close="handleClose"
        active-text-color="#ffd04b"
        background-color="#545c64"
        text-color="#fff">

        <!-- 动态渲染菜-->
        <template v-for="menu in menuList" :key="menu.id">
          <!-- 普通菜单项 - 不是目录且没有子菜单 -->
          <el-menu-item v-if="!menu.is_catalog && (!menu.children || menu.children.length === 0)" :index="menu.web_path || '/'">
            <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
            <span>{{ menu.name }}</span>
          </el-menu-item>
          
          <!-- 目录（包含子菜单- 是目录或者有子菜-->
          <el-sub-menu v-else :index="menu.id.toString()">
            <template #title>
              <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
              <span>{{ menu.name }}</span>
            </template>
            <template v-for="subMenu in (menu.children || [])" :key="subMenu.id">
              <!-- 二级菜单- 不是目录且没有子菜单 -->
              <el-menu-item v-if="!subMenu.is_catalog && (!subMenu.children || subMenu.children.length === 0)" :index="subMenu.web_path || '/'">
                <el-icon><component :is="getIconComponent(subMenu.icon)" /></el-icon>
                <span>{{ subMenu.name }}</span>
              </el-menu-item>
              
              <!-- 三级菜单 - 是目录或者有子菜-->
              <el-sub-menu v-else :index="subMenu.id.toString()">
                <template #title>
                  <el-icon><component :is="getIconComponent(subMenu.icon)" /></el-icon>
                  <span>{{ subMenu.name }}</span>
                </template>
                <el-menu-item 
                  v-for="thirdMenu in (subMenu.children || [])" 
                  :key="thirdMenu.id" 
                  :index="thirdMenu.web_path || '/'">
                  <el-icon><component :is="getIconComponent(thirdMenu.icon)" /></el-icon>
                  <span>{{ thirdMenu.name }}</span> 
                </el-menu-item>
              </el-sub-menu>
            </template>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
  </div>
</template>

<script>
import { useAppStore } from '../store/app'
import { storeToRefs } from 'pinia'
import { watch, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getUserMenus } from '../api/menu'
import * as antIcons from '@ant-design/icons-vue'

export default {
  name: 'Sidebar',
  setup() {
    const appStore = useAppStore()
    const { isCollapse, siteSettings } = storeToRefs(appStore)
    const router = useRouter()
    const menuList = ref([])
    
    // 将 ant-xxx-outlined 格式转换为 Ant Design Vue 组件名
    const getIconComponent = (iconName) => {
      if (!iconName) return antIcons.AppstoreOutlined
      
      // 如果是 ant-xxx-outlined 格式，转换为 PascalCase
      if (iconName.startsWith('ant-')) {
        const parts = iconName.replace('ant-', '').replace('-outlined', '').split('-')
        const componentName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Outlined'
        
        // 尝试从 Ant Design 图标库获取
        if (antIcons[componentName]) {
          return antIcons[componentName]
        }
      }
      
      // 如果已经是 PascalCase 格式（如 Building）
      const parts = iconName.split(/(?=[A-Z])/)
      if (parts.length > 1) {
        const componentName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Outlined'
        if (antIcons[componentName]) {
          return antIcons[componentName]
        }
      }
      
      // 默认返回 AppstoreOutlined
      return antIcons.AppstoreOutlined
    }
    
    // 获取硬编码的默认菜单数据（作为fallback或初始化数据）
    const getDefaultMenuData = () => {
      return [
        {
          id: 0,
          name: '首页',
          icon: 'Home',
          web_path: '/dashboard',
          is_catalog: false,
          children: null
        },
        {
          id: 1,
          name: '权限管理',
          icon: 'Appstore',
          is_catalog: true,
          children: [
            { id: 11, name: '用户管理', icon: 'User', web_path: '/users', is_catalog: false },
            { id: 12, name: '角色管理', icon: 'Team', web_path: '/roles', is_catalog: false },
            { id: 13, name: '部门管理', icon: 'Bank', web_path: '/departments', is_catalog: false },
            { id: 14, name: '岗位管理', icon: 'Safety', web_path: '/position', is_catalog: false },
            { id: 15, name: '菜单管理', icon: 'Appstore', web_path: '/menus', is_catalog: false },
            { id: 16, name: '按钮管理', icon: 'Tool', web_path: '/button-management', is_catalog: false },
            { id: 17, name: 'API白名', icon: 'Lock', web_path: '/whitelists', is_catalog: false }
          ]
        },
        {
          id: 2,
          name: '系统配置',
          icon: 'Setting',
          is_catalog: true,
          children: [
            { id: 21, name: '字典管理', icon: 'UnorderedList', web_path: '/dictionary', is_catalog: false },
            { id: 22, name: '网站设置', icon: 'Setting', web_path: '/settings', is_catalog: false }
          ]
        },
        {
          id: 3,
          name: '日志管理',
          icon: 'FileText',
          is_catalog: true,
          children: [
            { id: 31, name: '操作日志', icon: 'FileText', web_path: '/operationlog', is_catalog: false },
            { id: 32, name: '登录日志', icon: 'FileText', web_path: '/loginlog', is_catalog: false }
          ]
        },
        {
          id: 7,
          name: '计划任务',
          icon: 'ClockCircle',
          is_catalog: true,
          children: [
            { id: 71, name: '任务配置', icon: 'Form', web_path: '/task/config', is_catalog: false },
            { id: 72, name: '任务日志', icon: 'FileText', web_path: '/task/log', is_catalog: false }
          ]
        },
        {
          id: 4,
          name: '数据管理',
          icon: 'Database',
          is_catalog: true,
          children: [
            { id: 41, name: '文件管理', icon: 'File', web_path: '/file', is_catalog: false }
          ]
        },
        {
          id: 8,
          name: '系统监控',
          icon: 'Monitor',
          is_catalog: true,
          children: [
            { id: 81, name: '在线用户', icon: 'User', web_path: '/monitor/online', is_catalog: false },
            { id: 82, name: '服务监控', icon: 'Monitor', web_path: '/monitor/service', is_catalog: false },
            { id: 83, name: 'Redis监控', icon: 'Database', web_path: '/monitor/redis', is_catalog: false },
            { id: 84, name: '数据库监控', icon: 'Database', web_path: '/monitor/database', is_catalog: false }
          ]
        },
        {
          id: 6,
          name: '消息管理',
          icon: 'Message',
          is_catalog: true,
          children: [
            { id: 61, name: '消息管理', icon: 'Notification', web_path: '/message', is_catalog: false }
          ]
        },
        {
          id: 9,
          name: '租户管理',
          icon: 'Building',
          is_catalog: true,
          children: [
            { id: 91, name: '租户管理', icon: 'Building', web_path: '/tenants', is_catalog: false }
          ]
        },
        {
          id: 10,
          name: '工作流管理',
          icon: 'GitBranch',
          is_catalog: true,
          children: [
            { id: 101, name: '工作流定义', icon: 'GitBranch', web_path: '/workflow', is_catalog: false },
            { id: 102, name: '流程实例', icon: 'Clock', web_path: '/workflow/instance', is_catalog: false },
            { id: 103, name: '任务中心', icon: 'List', web_path: '/workflow/tasks', is_catalog: false }
          ]
        },
        {
          id: 5,
          name: '个人中心',
          icon: 'User',
          is_catalog: true,
          children: [
            { id: 51, name: '个人中心', icon: 'User', web_path: '/user/settings', is_catalog: false }
          ]
        }
      ]
    }
    
    // 获取动态菜单数据
    const fetchMenuData = async () => {
      try {
        const data = await getUserMenus()
                
        if (Array.isArray(data) && data.length > 0) {
          // 先检查后端返回的数据结构
          // 处理后端返回的菜单数据，确保结构正确
          menuList.value = transformMenuData(data)
        } else {
          // 如果后端没有数据，使用硬编码的默认菜单
          console.warn('后端菜单数据为空，使用默认菜单')
          menuList.value = getDefaultMenuData()
        }
      } catch (error) {
        console.error('获取菜单数据失败:', error)
        // 使用硬编码的默认菜单作为fallback
        menuList.value = getDefaultMenuData()
      }
    }
    
    // 转换后端菜单数据结构
    const transformMenuData = (data) => {
      // 构建树形结构
      const menuMap = {}
      const roots = []
      
      // 首先将所有菜单放入map
      data.forEach(menu => {
        menuMap[menu.id] = {
          ...menu,
          children: []
        }
      })
      
      // 构建父子关系 - 支持parent是对象或数字ID
      data.forEach(menu => {
        // 获取父节点ID - 支持 parent.id 或直接是数字
        const parentId = menu.parent && menu.parent.id ? menu.parent.id : menu.parent
        
        if (parentId && menuMap[parentId]) {
          menuMap[parentId].children.push(menuMap[menu.id])
        } else if (!parentId || parentId === null || parentId === 0) {
          roots.push(menuMap[menu.id])
        } else {
          console.warn('Sidebar: 找不到父菜单ID:', parentId, '菜单:', menu.name)
          roots.push(menuMap[menu.id])
        }
      })
      
      // 按sort排序，并确保is_catalog字段正确
      const sortMenu = (menus) => {
        return menus.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map(menu => {
          // 如果没有is_catalog字段，根据是否有子菜单来判断
          if (menu.is_catalog === undefined || menu.is_catalog === null) {
            menu.is_catalog = menu.children && menu.children.length > 0
          }
          if (menu.children && menu.children.length > 0) {
            menu.children = sortMenu(menu.children)
          }
          return menu
        })
      }
      
      const result = sortMenu(roots)
      
      return result
    }

    // 监听isCollapse状态变化
    watch(isCollapse, (newVal, oldVal) => {
      // 侧边栏折叠/展开时的处理逻辑
    })

    // 监听路由变化
    watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
      // 路由变化时的处理逻辑
    })

    const handleSelect = (key, keyPath) => {
      // 菜单选中时的处理逻辑
    }

    const handleOpen = (key, keyPath) => {
      // 菜单展开时的处理逻辑
    }

    const handleClose = (key, keyPath) => {
      // 菜单关闭时的处理逻辑
    }

    // 组件挂载时初始化状态
    onMounted(() => {
            fetchMenuData()
    })

    return {
      isCollapse,
      siteSettings,
      menuList,
      handleSelect,
      handleOpen,
      handleClose,
      getIconComponent
    }
  }
}
</script>

<style scoped>
.nav-side {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 侧边栏头部样- 固定在顶*/
.sidebar-header {
  height: 50px;
  line-height: 50px;
  background-color: #545c64;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex; 
  align-items: center;
  padding-left: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
}

.title {
  color: #fff;
  text-align: left;
  font-size: 16px;
  font-weight: 400;
  transition: all 0.3s ease;
  white-space: nowrap;
  width: 100%;
  display: block;
}

/* 折叠状态下的标题样*/
/* .title-collapsed {
  display: none;
} */

.el-menu {
  flex: 1;
  overflow-x: visible; /* 允许级联菜单超出 */
  overflow-y: auto; /* 允许菜单内容垂直滚动 */
}

/* Webkit浏览器滚动条样式 */
.el-menu::-webkit-scrollbar {
  width: 6px;
}

.el-menu::-webkit-scrollbar-track {
  background: transparent;
}

.el-menu::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.el-menu::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

/* 确保el-menu-item-group能正常工*/
.el-menu-item-group {
  padding: 0 !important;
}

/* 确保菜单展开/折叠时的宽度控制 */
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  overflow: visible; /* 允许级联菜单超出 */
}

/* 确保el-menu-vertical-demo能够正确折叠 */
.el-menu--collapse {
  width: 64px !important;
  overflow: visible; /* 允许折叠状态下级联菜单超出 */
}

/* 折叠状态下的标题样*/
:deep(.el-menu--collapse) {
  .title {
    display: none;
  }
}

/* 确保级联菜单不会影响侧边栏宽- 关键修复 */
:deep(.el-sub-menu__popper) {
  position: absolute !important;
  left: 100% !important;
  top: 0 !important;
  margin-left: 0 !important;
  z-index: 2000 !important; /* 确保在最上层 */
}

/* 折叠状态下级联菜单的定*/
.el-menu--collapse :deep(.el-sub-menu__popper) {
  left: 100% !important;
}

/* 确保菜单项可以正常点击和展开 */
.el-menu-item, .el-sub-menu {
  cursor: pointer !important;
}

/* 确保子菜单可以正常展开 */
.el-sub-menu .el-menu {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

/* 菜单图标样式 */
.menu-icon {
  width: 18px !important;
  height: 18px !important;
  margin-right: 8px;
  font-size: 18px;
}

/* 折叠状态下的图标样*/
.el-menu--collapse .menu-icon {
  margin-right: 0;
  text-align: center;
}
</style>