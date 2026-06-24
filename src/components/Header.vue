<template>
  <el-header>
    <div class="header-content">
      <div class="header-left">
        <el-button type="info" @click="toggleMenuCollapse">
          <el-icon>
            <ant-menu-unfold-outlined v-if="appStore.isCollapse" />
            <ant-menu-fold-outlined v-else />
          </el-icon>
        </el-button>
      </div>

      <div class="header-right">
        <!-- 租户选择-->
        <TenantSelector />
        <!-- 消息图标 -->
        <div class="notification-wrapper">
          <el-dropdown @command="handleNotificationCommand" ref="notificationDropdown">
            <span class="notification-icon">
              <el-badge :value="unreadCount" class="notification-badge">
                <el-button type="text" style="color: #fff; font-size: 20px;">
                  <el-icon><ant-bell-outlined /></el-icon>
                </el-button>
              </el-badge>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="notification-menu">
            <div class="notification-header">
              <span>消息通知</span>
              <el-button 
                type="text" 
                size="small" 
                @click.stop="markAllAsReadLocal"
                style="color: #409eff; padding: 0 10px;"
              >
                全部已读
              </el-button>
            </div>
            <!-- 消息分类切换 -->
            <div class="notification-tabs" v-if="notifications.length > 0">
              <el-radio-group v-model="notificationTab" size="small" style="width: 100%;">
                <el-radio-button label="all" style="width: 50%;">全部消息</el-radio-button>
                <el-radio-button label="unread" style="width: 50%;">未读消息</el-radio-button>
              </el-radio-group>
            </div>
            <div class="notification-content" v-if="filteredNotifications.length > 0">
              <el-dropdown-item 
                v-for="notification in filteredNotifications" 
                :key="notification.id" 
                :command="notification.id" 
                class="notification-item"
                :class="{ 'unread': !notification.is_read }"
              >
                <div class="notification-item-content">
                  <!-- 优先级标识 -->
                  <div v-if="notification.priority === 2" class="priority-badge urgent"></div>
                  <div v-else-if="notification.priority === 1" class="priority-badge important"></div>
                  <div class="notification-main">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.content }}</div>
                    <div class="notification-meta">
                      <span class="notification-type" v-if="notification.message_type">{{ notification.message_type }}</span>
                      <span class="notification-time">{{ formatDate(notification.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </el-dropdown-item>
            </div>
            <div v-else-if="notifications.length > 0" class="no-notifications">
              暂无{{ notificationTab === 'unread' ? '未读' : '' }}消息通知
            </div>
            <div v-else class="no-notifications">
              暂无消息通知
            </div>
            <div class="notification-footer">
              <el-button 
                type="text" 
                size="small" 
                @click.stop="viewAllMessages"
                style="color: #409eff; padding: 0;"
              >
                查看全部
              </el-button>
            </div>
          </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <!-- 用户信息 -->
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-avatar :src="avatarUrl" :size="32" style="margin-right: 8px" />
              <span class="username-text">{{ username }}</span>
              <el-icon class="el-icon--right">
                <AntDownOutlined />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="user-center">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
  </el-header>
</template>
  
<script>
import { useUserStore } from '../store/user' // 导入 Pinia Store
import { useAppStore } from '../store/app' // 导入 App Store
import { useRouter } from 'vue-router'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { getUnreadCount, getRecentNotifications, markAsRead, markAllAsRead } from '../api/message' // 导入消息相关API函数
import TenantSelector from './TenantSelector.vue'

// 注意：图标已在main.js中全局注册，无需在此处导
export default {
  name: 'AppHeader',
  setup() {
    const userStore = useUserStore() // 创建用户 Store
    const appStore = useAppStore() // 创建 App Store
    const router = useRouter()
    const username = ref('')
    const avatarUrl = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png') // 默认头像
    const unreadCount = ref(0)
    const notifications = ref([])
    const notificationDropdown = ref(null)
    const notificationTab = ref('all') // 'all' 'unread'
    const filteredNotifications = computed(() => {
      if (notificationTab.value === 'unread') {
        return notifications.value.filter(notification => !notification.is_read)
      }
      return notifications.value
    })

    // 加载用户信息
    const loadUserInfo = () => {
      username.value = userStore.username || 'admin'
      // 实际项目中可能从后端获取头像URL
    }
    
    // WebSocket实例
    let ws = null
    let reconnectTimer = null
    // 后端WebSocket连接地址，与后端routing.py中的配置保持一致
    const wsUrl = process.env.NODE_ENV === 'production' ?
      'wss://your-api-domain/ws/notifications/' :
      'ws://localhost:8000/ws/notifications/'
    
    // 初始化WebSocket连接
    const initWebSocket = () => {
      // 如果已有连接，先关闭
      if (ws) {
        ws.close()
        ws = null
      }
      
      try {
        // 创建WebSocket连接，携带认证token
        const token = userStore.token
        const wsUrlWithAuth = `${wsUrl}token=${encodeURIComponent(token)}`
        ws = new WebSocket(wsUrlWithAuth)
        
        // 连接成功
        ws.onopen = () => {
          // 连接成功后，先获取一次当前未读消息数量
          loadUnreadCount()
          loadRecentNotifications()
          
          // 清除重连定时器
          if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
          }
        }
        
        // 接收消息
        ws.onmessage = (event) => {
          try {
            if (!event.data) {
              console.warn('WebSocket received empty message')
              return
            }
            const data = JSON.parse(event.data)
            
            if (!data || typeof data !== 'object') {
              console.warn('WebSocket received invalid message data')
              return
            }
          
            // 处理不同类型的消息
            switch (data.type) {
            case 'notification':
              // 收到新通知时的处理逻辑
              // 注意：后端推送的消息结构是{type: 'notification', data: {具体消息数据}}
              if (data.data) {
                // 将后端数据结构转换为前端所需格式
                const notificationData = {
                  id: data.data.notification_id,
                  title: data.data.title,
                  content: data.data.content,
                  created_at: data.data.created_at,
                  is_read: data.data.is_read
                }
                
                // 添加新通知到列表开头
                notifications.value.unshift(notificationData)
                // 保持通知列表最新10条
                if (notifications.value.length > 10) {
                  notifications.value.pop()
                }
                
                // 重新加载未读消息数量
                loadUnreadCount()
              }
              break
            case 'message_read': {
              // 消息已读时更新状态
              const notification = notifications.value.find(item => item.id === data.message_id)
            if (notification) {
              notification.is_read = true
            }
            // 更新未读数量
            loadUnreadCount()
            break
          }
            default:
              break
            }
          } catch (error) {
            console.error('解析WebSocket消息失败:', error)
          }
        }
        
        // 连接关闭
        ws.onclose = () => {
          // 设置重连（延迟5秒后尝试重连）
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              initWebSocket()
            }, 5000)
          }
        }
        
        // 连接错误
        ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error)
        }
      } catch (error) {
        console.error('初始化WebSocket失败:', error)
        // 尝试重连
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            initWebSocket()
          }, 5000)
        }
      }
    }
    
    // 加载未读消息数量 - 仅用于初始加载
    const loadUnreadCount = () => {
      getUnreadCount()
        .then(response => {
          unreadCount.value = response.count || 0
        })
        .catch(error => {
          console.error('获取未读消息数量失败', error)
        })
    }
    
    // 加载最近的通知 - 仅用于初始加载
    const loadRecentNotifications = () => {
      getRecentNotifications()
        .then(response => {
          notifications.value = response.results || []
        })
        .catch(error => {
          console.error('Header: 获取最近通知失败', error)
        })
    }
    
    // 关闭WebSocket连接
    const closeWebSocket = () => {
      if (ws) {
        ws.close()
        ws = null
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    // 切换菜单展开/折叠
    const toggleMenuCollapse = () => {
      appStore.toggleCollapse()
    }
    
    // 处理通知点击
    const handleNotificationCommand = (command) => {
      // 标记该消息为已读
      markAsRead(command)
        .then(() => {
          // 更新本地通知状态
          const notification = notifications.value.find(item => item.id === command)
          if (notification) {
            notification.is_read = true
          }
          // 更新未读数量 - 通过WebSocket自动更新，无需手动调用API
          // 跳转到消息详情或消息列表
          router.push('/message')
        })
        .catch(error => {
          console.error('标记消息已读失败', error)
        })
    }
    
    // 标记所有消息为已读
    const markAllAsReadLocal = () => {
      markAllAsRead()
        .then(() => {
          // 更新本地通知状态
          notifications.value.forEach(notification => {
            notification.is_read = true
          })
          // 清空未读数量
          unreadCount.value = 0
        })
        .catch(error => {
          console.error('标记所有消息已读失败：', error)
        })
    }
    
    // 查看所有消息
    const viewAllMessages = () => {
      router.push('/message')
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) {
        return '刚刚'
      } else if (diffMins < 60) {
        return `${diffMins}分钟前`
      } else if (diffHours < 24) {
        return `${diffHours}小时前`
      } else if (diffDays < 7) {
        return `${diffDays}天前`
      } else {
        return date.toLocaleDateString('zh-CN')
      }
    }

    // 处理下拉菜单命令
    const handleCommand = (command) => {
      if (command === 'user-center') {
        router.push('/user/settings')
      } else if (command === 'logout') {
        userStore.logout()        
        router.push('/login')
      }
    }

    // 组件挂载时加载用户信息
    onMounted(() => {
      loadUserInfo()
      
      // 初始化WebSocket连接（会自动加载初始消息数据）
      initWebSocket()
      
      // 监听路由变化，只重新加载用户信息
      router.afterEach(() => {
        loadUserInfo()
      })
    })
    
    // 组件卸载时清理资源
    onUnmounted(() => {
      closeWebSocket()
    })

    return {
      username,
      avatarUrl,
      handleCommand,
      toggleMenuCollapse,
      unreadCount,
      notifications,
      notificationDropdown,
      handleNotificationCommand,
      markAllAsReadLocal,
      viewAllMessages,
      formatDate,
      notificationTab,
      filteredNotifications,
      appStore
    }
  },
}
</script>

  <style scoped>
  .el-header {
    background-color: #545c64;
    color: #fff;
    padding: 0;
    text-align: center;
    height: 50px;
  }
  .el-breadcrumb-item {
    color: white !important; /* 强制设置为白色 */
    font-size: 16px;
    font-weight: 400;
    line-height: 40px;
    text-align: center;
  }
  .header-left {
    display: flex;
    align-items: center;
  }

  .header-content {
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 50px;
    height: 50px;
  }

  .header-right {
    display: flex;
    align-items: center;
  }

  .el-dropdown-link {
    cursor: pointer;
    color: #fff;
    display: flex;
    align-items: center;
    height: 100%;
  }

  .username-text {
    color: #fff;
    margin: 0 8px;
    vertical-align: middle;
  }

  .breadcrumb {
    font-size: 18px;
    color: #fff;
    padding: 10px;
  }

  .user-info {
    font-size: 16px;
    display: flex;
    align-items: center;
    height: 100%;
  }

  /* 通知相关样式 */
  .notification-wrapper {
    margin-right: 20px;
    position: relative;
    display: flex;
    align-items: center;
  }

  .notification-icon {
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .notification-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .notification-menu {
    width: 450px;
    max-height: 500px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .notification-header {
    padding: 10px 15px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    background-color: #fafafa;
  }

  /* 消息分类标签*/
  .notification-tabs {
    padding: 5px 10px;
    border-bottom: 1px solid #e4e7ed;
  }

  .notification-content {
    flex: 1;
    overflow-y: auto;
    max-height: 350px;
  }

  .notification-item {
    padding: 10px 15px;
    cursor: pointer;
    transition: all 0.3s;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: flex-start;
  }

  .notification-item:hover {
    background-color: #f5f7fa;
  }

  .notification-item.unread {
    background-color: #f0f9ff;
  }

  .notification-item-content {
    white-space: normal;
    flex: 1;
    display: flex;
    align-items: flex-start;
  }

  /* 优先级标*/
  .priority-badge {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 10px;
    margin-top: 6px;
    flex-shrink: 0;
  }

  .priority-badge.urgent {
    background-color: #f56c6c;
  }

  .priority-badge.important {
    background-color: #e6a23c;
  }

  .notification-main {
    flex: 1;
  }

  .notification-title {
    font-weight: 500;
    margin-bottom: 3px;
    color: #303133;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notification-message {
    color: #606266;
    font-size: 12px;
    margin-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .notification-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .notification-type {
    background-color: #e6f7ff;
    color: #1890ff;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
  }

  .notification-time {
    color: #909399;
    font-size: 11px;
  }

  .no-notifications {
    padding: 40px 20px;
    text-align: center;
    color: #909399;
  }

  .notification-footer {
    padding: 10px 15px;
    border-top: 1px solid #e4e7ed;
    text-align: center;
    background-color: #fafafa;
  }
  </style>
  