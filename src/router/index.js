import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import Login from '../views/Login.vue'
import User from '../views/User.vue'
import Role from '../views/Role.vue'
import Menu from '../views/Menu.vue'
import MenuPermission from '../views/MenuPermission.vue'
import Dashboard from '../views/Dashboard.vue'
import Position from '../views/Position.vue'
import Department from '../views/Department.vue'
import Settings from '../views/Settings.vue'
import LoginLog from '../views/LoginLog.vue'
import OperationLog from '../views/OperationLog.vue'
import UserSetting from '../views/UserSetting.vue'
import Dictionary from '../views/Dictionary.vue'
import FileManagement from '../views/FileManagement.vue'
import Message from '../views/Message.vue'
import TaskConfig from '../views/TaskConfig.vue'
import TaskLog from '../views/TaskLog.vue'
import ApiWhiteList from '../views/ApiWhiteList.vue'
import MenuButton from '../views/MenuButton.vue'
import ButtonManagement from '../views/ButtonManagement.vue'
// 新增：租户和工作流视图
import Tenant from '../views/Tenants.vue'
import Workflow from '../views/Workflow.vue'
import WorkflowInstance from '../views/WorkflowInstance.vue'
import WorkflowTaskCenter from '../views/WorkflowTaskCenter.vue'

import { isAuthenticated } from '../utils/auth'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      { 
        path: '/dashboard', 
        component: Dashboard, 
        name: 'Dashboard',
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      { 
        path: '/users', 
        component: User, 
        name: 'User',
        meta: { title: '用户管理', icon: 'User' }
      },
      { 
        path: '/roles', 
        component: Role, 
        name: 'Role',
        meta: { title: '角色管理', icon: 'User' }
      },
      { 
        path: '/position', 
        component: Position, 
        name: 'Position',
        meta: { title: '职级管理', icon: 'OfficeBuilding' }
      },
      { 
        path: '/settings', 
        component: Settings, 
        name: 'Settings',
        meta: { title: '网站设置', icon: 'Setting' }
      },
      { 
        path: '/departments', 
        component: Department, 
        name: 'Department',
        meta: { title: '部门管理', icon: 'OfficeBuilding' }
      },
      { 
        path: '/menus', 
        component: Menu, 
        name: 'Menu',
        meta: { title: '菜单管理', icon: 'Menu' } 
      },
      { 
        path: '/menu-permission', 
        component: MenuPermission, 
        name: 'MenuPermission',
        meta: { title: '菜单权限管理', icon: 'Lock' } 
      },
      { path: '/menu-button-management', component: MenuButton, name: 'MenuButton', meta: { title: '按钮配置', icon: 'Setting' } },
      { path: '/button-management', component: ButtonManagement, name: 'ButtonManagement', meta: { title: '按钮管理', icon: 'Setting' } },
      { 
        path: '/loginlog', 
        component: LoginLog, 
        name: 'LoginLog',
        meta: { title: '登录日志', icon: 'User' }
      },
      { 
        path: '/operationlog', 
        component: OperationLog, 
        name: 'OperationLog',
        meta: { title: '操作日志', icon: 'User' }
      },
      { 
        path: '/user/settings', 
        component: UserSetting, 
        name: 'UserSetting',
        meta: { title: '个人中心', icon: 'User' }
      },
      { 
        path: '/dictionary', 
        component: Dictionary, 
        name: 'Dictionary',
        meta: { title: '字典管理', icon: 'User' }
      },
      { 
        path: '/file', 
        component: FileManagement, 
        name: 'FileManagement',
        meta: { title: '文件管理', icon: 'Menu' }
      },
      { 
        path: '/message', 
        component: Message, 
        name: 'Message',
        meta: { title: '消息管理', icon: 'Message' } 
      },
      { 
        path: '/whitelists', 
        component: ApiWhiteList, 
        name: 'ApiWhiteList',
        meta: { title: '接口白名单', icon: 'Lock' } 
      },
      { 
        path: '/tenants', 
        component: Tenant, 
        name: 'Tenant',
        meta: { title: '租户管理', icon: 'Building' } 
      },
      { 
        path: '/workflow', 
        name: 'Workflow',
        component: Workflow,
        meta: { title: '工作流定义', icon: 'GitCommit' }
      },
      {
        path: '/workflow/instance',
        component: WorkflowInstance,
        name: 'WorkflowInstance',
        meta: { title: '流程实例', icon: 'List' }
      },
      {
        path: '/workflow/tasks',
        component: WorkflowTaskCenter,
        name: 'WorkflowTaskCenter',
        meta: { title: '任务中心', icon: 'Clock' }
      },
      { 
        path: '/monitor', 
        name: 'monitor',
        meta: { title: '系统监控', icon: 'Shield' },
        children: [
          { 
            path: 'online', 
            name: 'OnlineUserMonitor',
            component: () => import('@/views/monitor/online/index.vue'),
            meta: { title: '在线用户', icon: 'Users' } 
          },
          { 
            path: 'service', 
            name: 'ServiceMonitor',
            component: () => import('@/views/monitor/service/index.vue'),
            meta: { title: '服务监控', icon: '' } 
          },
          { 
            path: 'redis', 
            name: 'RedisMonitor',
            component: () => import('@/views/monitor/redis/index.vue'),
            meta: { title: 'Redis监控', icon: '' } 
          },
          { 
            path: 'database', 
            name: 'DatabaseMonitor',
            component: () => import('@/views/monitor/database/index.vue'),
            meta: { title: '数据库监控', icon: '' } 
          }
        ]
      },
      { 
        path: '/task', 
        name: 'Task',
        meta: { title: '定时任务', icon: 'Clock' },
        children: [
          {
            path: '/task/config',
            component: TaskConfig,
            name: 'TaskConfig',
            meta: { title: '任务配置', icon: '' }
          },
          {
            path: '/task/log',
            component: TaskLog,
            name: 'TaskLog',
            meta: { title: '任务日志', icon: '' }
          }
        ]
      },
    ],
  },
  {
    path: '/login', 
    component: Login, 
    name: 'Login',
    meta: {
      title: '登录',
      requiresAuth: false
    },
  },
  { 
    path: '/:catchAll(.*)', 
    redirect: '/dashboard', 
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - zzadmin管理系统`
  } else {
    document.title = 'zzadmin管理系统'
  }

  const requiresAuth = to.meta.requiresAuth !== false
  if (requiresAuth && !isAuthenticated()) {
    return next({ name: 'Login', query: { redirect: to.path } })
  }

  if (to.path === '/login' && isAuthenticated()) {
    return next({ name: 'Dashboard' })
  }

  next()
})

router.afterEach((to, from) => {
})

export default router