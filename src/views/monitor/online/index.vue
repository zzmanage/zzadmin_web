<template>
  <div class="online-user-monitor">
    <!-- 监控头部 -->
    <div class="monitor-header">
      <div class="header-left">
        <h1>在线用户</h1>
        <div class="online-stats">
          <el-badge :value="onlineUsers.length" type="primary" />
          <span> 当前在线</span>
          <div class="divider"></div>
          <span class="last-refresh">最后更 {{ lastRefreshTime }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-select v-model="refreshInterval" placeholder="刷新间隔" @change="restartAutoRefresh" size="small" class="refresh-interval-select">
          <el-option label="禁用" value="0" />
          <el-option label="30秒" value="30000" />
          <el-option label="60秒" value="60000" />
          <el-option label="3分钟" value="180000" />
          <el-option label="5分钟" value="300000" />
        </el-select>
        <el-button type="primary" @click="refreshData" size="small" style="margin-left: 10px;">
          <el-icon><ant-reload-outlined /></el-icon> 刷新数据
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户姓名/IP"
            prefix-icon="SearchOutlined"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            @input="debounceSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="departmentFilter" placeholder="筛选部门" clearable @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="roleFilter" placeholder="筛选角色" clearable @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option v-for="role in roles" :key="role" :label="role" :value="role" />
          </el-select>
        </el-col>

      </el-row>
    </div>

    <!-- 用户列表 -->
    <el-card class="user-list-card" shadow="never">
      <el-table
          v-loading="loading"
          :data="paginatedUsers"
          style="width: 100%"
          border
          stripe
          fit
          :header-cell-style="{background: '#fafafa'}"
          @row-click="showUserDetail"
        >
        <el-table-column prop="id" label="用户ID" width="80" />
        <el-table-column prop="username" label="用户名" width="140">
          <template #default="scope">
            <el-tag type="info" size="small">{{ scope.row.username }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="department" label="部门" width="150">
          <template #default="scope">
            <el-tag :type="getDeptTagType(scope.row.department)">{{ scope.row.department }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="role_name" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.role_name)">{{ scope.row.role_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="login_time" label="登录时间" width="180" :formatter="formatDate" />
        <el-table-column prop="login_ip" label="登录IP" width="140">
          <template #default="scope">
            <el-tooltip :content="getIpInfo(scope.row.login_ip)" placement="top">
              <span class="ip-text">{{ scope.row.login_ip }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="last_active_time" label="最后活动时间" width="180" :formatter="formatDate" />
        <el-table-column prop="active_duration" label="在线时长" width="120" :formatter="formatActiveDuration" />
        <el-table-column label="操作" width="120" fixed="right" :align="'center'">
          <template #default="scope">
            <el-button type="text" @click.stop="showUserDetail(scope.row)" size="small" :title="'查看详情'">
              <el-icon><ant-eye-outlined /></el-icon>
            </el-button>
            <el-button type="text" @click.stop="kickOutUser(scope.row)" size="small" danger :title="'踢出用户'">
              <el-icon><ant-arrow-right-outlined /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination-container" v-if="filteredUsers.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredUsers.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户详情对话-->
    <el-dialog v-model="showDetailDialog" title="用户详情" width="500px" append-to-body>
      <div v-if="selectedUser" class="user-detail">
        <div class="detail-row">
          <span class="label">用户ID:</span>
          <span class="value">{{ selectedUser.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">用户</span>
          <span class="value">{{ selectedUser.username }}</span>
        </div>
        <div class="detail-row">
          <span class="label">姓名:</span>
          <span class="value">{{ selectedUser.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">部门:</span>
          <span class="value">{{ selectedUser.department }}</span>
        </div>
        <div class="detail-row">
          <span class="label">角色:</span>
          <span class="value">{{ selectedUser.role_name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">登录IP:</span>
          <span class="value">{{ selectedUser.login_ip }}</span>
        </div>
        <div class="detail-row">
          <span class="label">登录时间:</span>
          <span class="value">{{ formatDate(null, null, selectedUser.login_time) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">最后活</span>
          <span class="value">{{ formatDate(null, null, selectedUser.last_active_time) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">在线时长:</span>
          <span class="value">{{ formatActiveDuration(null, null, selectedUser.login_time) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElButton, ElIcon, ElTable, ElTableColumn, ElMessage, ElCard, ElInput, 
  ElSelect, ElOption, ElPagination, ElDialog, ElBadge, ElTooltip, ElTag } from 'element-plus'

import monitorAPI from '@/api/monitor'

export default {
  name: 'OnlineUserMonitor',
  components: {
    ElButton,
    ElIcon,
    ElTable,
    ElTableColumn,
    ElCard,
    ElInput,
    ElSelect,
    ElOption,
    ElPagination,
    ElDialog,
    ElBadge,
    ElTooltip,
    ElTag
  },
  data() {
    return {
      onlineUsers: [],
      filteredUsers: [],
      loading: false,
      refreshTimer: null,
      searchTimer: null,
      lastRefreshTime: '',
      searchKeyword: '',
      departmentFilter: '',
      roleFilter: '',
      refreshInterval: '60000', // 默认60秒
      currentPage: 1,
      pageSize: 20,
      departments: [],
      roles: [],
      showDetailDialog: false,
      selectedUser: null
    }
  },
  computed: {
    // 分页后的数据
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredUsers.slice(start, end)
    }
  },
  mounted() {
    this.loadOnlineUsers()
    this.startAutoRefresh()
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async loadOnlineUsers() {
      this.loading = true
      try {
        const response = await monitorAPI.getOnlineUsers()
                
        // 完善响应处理逻辑，参照service/index.vue的处理方式
        let apiData = null
        
        // 处理不同格式的响应对象
        if (response && response.data) {
          // 优先使用response.data
          apiData = response.data
        } else {
          // 直接使用response作为数据
          apiData = response
        }
        
        // 处理不同格式的业务数据
        if (apiData) {
          // 1. 检查是否是标准的后端响应格式 {code, message, data}
          if (apiData.code !== undefined) {
            if (apiData.code === 200 && apiData.data) {
              this.onlineUsers = Array.isArray(apiData.data) ? apiData.data : []
            } else {
              console.warn(`获取在线用户失败: ${apiData.message || '未知错误'}`)
              this.onlineUsers = []
              ElMessage.warning(`获取在线用户失败: ${apiData.message || '未知错误'}`)
            }
          }
          // 2. 直接处理数据对象（如果是数组）
          else if (Array.isArray(apiData)) {
            this.onlineUsers = apiData
          }
          // 3. 处理扁平化的数据对象（如response直接包含数据）
          else if (typeof apiData === 'object') {
            // 检查是否有data属性，可能是嵌套的数据结构
            if (apiData.data && Array.isArray(apiData.data)) {
              this.onlineUsers = apiData.data
            } else {
              // 如果不是数组，可能是单个用户对象，包装成数组
              this.onlineUsers = [apiData]
            }
          }
          // 4. 默认情况
          else {
            console.warn('获取在线用户数据格式错误')
            this.onlineUsers = []
            ElMessage.warning('获取在线用户数据格式错误')
          }
        } else {
          console.warn('未获取到在线用户数据')
          this.onlineUsers = []
          ElMessage.warning('未获取到在线用户数据')
        }
        
        // 更新部门和角色列表用于筛选
        this.updateFilterOptions()
        // 应用筛选
        this.applyFilters()
        // 更新最后刷新时间
        this.lastRefreshTime = new Date().toLocaleString()
      } catch (error) {
        console.error('获取在线用户失败:', error)
        this.onlineUsers = []
        ElMessage.error('获取在线用户失败')
      } finally {
        this.loading = false
      }
    },
    
    // 更新筛选选项
    updateFilterOptions() {
      // 提取唯一的部门列表
      const deptSet = new Set(this.onlineUsers.map(user => user.department))
      this.departments = Array.from(deptSet).filter(dept => dept)
      
      // 提取唯一的角色列表
      const roleSet = new Set(this.onlineUsers.map(user => user.role_name))
      this.roles = Array.from(roleSet).filter(role => role)
    },
    
    // 应用筛选
    applyFilters() {
      let result = [...this.onlineUsers]
      
      // 关键词搜索
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        result = result.filter(user => 
          user.username.toLowerCase().includes(keyword) ||
          (user.name && user.name.toLowerCase().includes(keyword)) ||
          (user.login_ip && user.login_ip.includes(keyword))
        )
      }
      
      // 部门筛选
      if (this.departmentFilter) {
        result = result.filter(user => {
          // 添加日志以调试筛选条件
          const match = user.department === this.departmentFilter
          return match
        })
      }
      
      // 角色筛选
      if (this.roleFilter) {
        result = result.filter(user => {
          // 添加日志以调试筛选条件
          const match = user.role_name === this.roleFilter
          return match
        })
      }
      
      // 按最后活动时间排序（最新的在前）
      result.sort((a, b) => new Date(b.last_active_time) - new Date(a.last_active_time))
      
      this.filteredUsers = result
      // 重置到第一页
      this.currentPage = 1
      // 强制刷新表格数据
      this.$nextTick(() => {
        this.$forceUpdate()
      })
    },
    
    // 处理搜索
    handleSearch() {
            this.applyFilters()
    },
    
    // 防抖搜索
    debounceSearch() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.handleSearch()
      }, 300) // 300毫秒防抖延迟
    },
    
    // 处理分页大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    
    // 处理当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current
    },
    
    // 刷新数据
    refreshData() {
      this.loadOnlineUsers()
    },
    
    // 开始自动刷新
    startAutoRefresh() {
      if (this.refreshInterval > 0) {
        this.refreshTimer = setInterval(() => {
          this.loadOnlineUsers()
        }, parseInt(this.refreshInterval))
      }
    },
    
    // 停止自动刷新
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    
    // 重新开始自动刷新
    restartAutoRefresh() {
      this.stopAutoRefresh()
      this.startAutoRefresh()
    },
    
    // 格式化日期
    formatDate(row, column, cellValue) {
      if (!cellValue) return ''
      return new Date(cellValue).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    
    // 格式化在线时长
    formatActiveDuration(row, column, loginTime) {
      if (!loginTime) return ''
      
      const loginDate = new Date(loginTime)
      const now = new Date()
      const durationMs = now - loginDate
      
      const seconds = Math.floor(durationMs / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (days > 0) {
        return `${days}${hours % 24}小时`
      } else if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟`
      } else if (minutes > 0) {
        return `${minutes}分钟${seconds % 60}秒`
      } else {
        return `${seconds}秒`
      }
    },
    
    // 显示用户详情
    showUserDetail(user) {
      this.selectedUser = user
      this.showDetailDialog = true
    },
    
    // 踢出用户
    async kickOutUser(user) {
      this.$confirm(`确定要踢出用户${user.username} (${user.name}) 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.loading = true
        try {
          const response = await monitorAPI.kickOutUser(user.id)
          if (response && (response.code === 200 || response.data.code === 200)) {
            ElMessage.success(`踢出用户 ${user.username} 成功`)
            this.loadOnlineUsers()
          } else {
            ElMessage.error('踢出用户失败')
          }
        } catch (error) {
          console.error('踢出用户失败:', error)
          ElMessage.error('踢出用户失败')
        } finally {
          this.loading = false
        }
      })
    },
    
    // 根据部门获取标签类型
    getDeptTagType(department) {
      const deptTypes = {
        '技术部': 'primary',
        '市场部': 'success',
        '销售部': 'warning',
        '行政部': 'info',
        '财务部': 'danger'
      }
      return deptTypes[department] || 'default'
    },
    
    // 根据角色获取标签类型
    getRoleTagType(role) {
      if (role.includes('管理')) {
        return 'danger'
      } else if (role.includes('超级')) {
        return 'warning'
      } else {
        return 'info'
      }
    },
    
    // 获取IP信息（简化版）
    getIpInfo(ip) {
      // 实际项目中可以调用IP查询API获取详细地理位置信息
      if (ip === '127.0.0.1' || ip === 'localhost') {
        return '本机地址'
      }
      return 'IP地址: ' + ip
    }
  }
}
</script>

<style scoped>
.online-user-monitor {
  padding: 20px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.header-right {
  display: flex;
  align-items: center;
}

.refresh-interval-select {
  min-width: 120px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.monitor-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.online-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #606266;
  font-size: 14px;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #dcdfe6;
}

.last-refresh {
  color: #909399;
  font-size: 13px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
}

.user-list-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.ip-text {
  cursor: pointer;
  color: #409eff;
}

.ip-text:hover {
  text-decoration: underline;
}

/* 用户详情对话框样*/
.user-detail {
  padding: 10px 0;
}

.detail-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  width: 100px;
  color: #909399;
  font-weight: 500;
}

.detail-row .value {
  flex: 1;
  color: #303133;
}

/* 表格行悬停效*/
.el-table__row:hover > td {
  background-color: #f5f7fa !important;
}

/* 表格单元格padding调整 */
.el-table__cell {
  padding: 10px 0;
}

/* 响应式设*/
@media screen and (max-width: 1200px) {
  .monitor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>