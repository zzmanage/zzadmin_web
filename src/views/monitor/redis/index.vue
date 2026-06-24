<template>
  <div class="redis-monitor">
    <div class="monitor-header">
      <h1>Redis监控</h1>
      <div class="refresh-controls">
        <el-button type="primary" @click="refreshData" :loading="loading" size="small">
          <el-icon><ant-reload-outlined /></el-icon>
          刷新数据
        </el-button>
        <span class="refresh-countdown">
          (自动刷新: {{ refreshCountdown }}s)
        </span>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- Redis连接状-->
      <el-col :span="6">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <el-icon><ant-link-outlined /></el-icon>
              <span>连接状态</span>
            </div>
          </template>
          <div class="redis-status">
            <div v-if="redisStatus" class="status-indicator">
              <div :class="['status-dot', redisStatus.connected ? 'connected' : 'disconnected']"></div>
              <span class="status-text">{{ redisStatus.connected ? '已连接' : '未连接' }}</span>
            </div>
            <div v-if="redisStatus" class="connection-info">
              <div class="info-item">主机: {{ redisStatus.host || 'localhost' }}:{{ redisStatus.port || 6379 }}</div>
              <div class="info-item">耗时: {{ redisStatus.response_time ? redisStatus.response_time.toFixed(2) : 0 }}ms</div>
              <div class="info-item">检查时间: {{ redisStatus.last_check_time || '-' }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Redis版本信息 -->
      <el-col :span="6">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <el-icon><ant-appstore-outlined /></el-icon>
              <span>版本信息</span>
            </div>
          </template>
          <div class="redis-version-info">
            <div v-if="redisStatus && redisStatus.version" class="info-item">
              Redis版本: {{ redisStatus.version }}
            </div>
            <div v-if="redisStatus && redisStatus.os" class="info-item">
              操作系统: {{ redisStatus.os }}
            </div>
            <div v-if="redisStatus && redisStatus.process_id" class="info-item">
              进程ID: {{ redisStatus.process_id }}
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Redis内存使用 -->
      <el-col :span="6">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <el-icon><ant-hard-drive-outlined /></el-icon>
              <span>内存使用</span>
            </div>
          </template>
          <div v-if="redisStatus" class="redis-memory">
            <el-statistic
              :value="redisStatus.memory_usage"
              suffix="MB"
              :value-style="{ color: '#1890ff' }"
            />
            <div class="memory-percent">
              {{ redisStatus.memory_usage_percent }}% 已使用
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 客户端连接数 -->
      <el-col :span="6">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <el-icon><ant-user-outlined /></el-icon>
              <span>客户端连接数</span>
            </div>
          </template>
          <div v-if="redisStatus" class="redis-clients">
            <el-statistic
              :value="redisStatus.clients_connected"
              :value-style="{ color: getClientCountColor(redisStatus.clients_connected) }"
            />
            <div class="clients-info">
              <div>阻塞: {{ redisPerformance && redisPerformance.clients ? redisPerformance.clients.blocked || 0 : 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 键空间信-->
      <el-col :span="12">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <el-icon><ant-key-outlined /></el-icon>
              <span>键空间信息</span>
            </div>
          </template>
          <div v-if="redisPerformance && Object.keys(redisPerformance.db_keys).length > 0" class="redis-keyspace">
            <div class="keyspace-summary">
              <div class="summary-item">
                <span class="summary-label">总键</span>
                <span class="summary-value">{{ getTotalKeys() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">命中</span>
                <span class="summary-value">{{ getHitRatio() }}%</span>
              </div>
            </div>
            <div class="keyspace-details">
              <div v-for="(keysCount, dbName) in redisPerformance.db_keys" :key="dbName" class="db-item">
                <div class="db-header">{{ dbName }}</div>
                <div class="db-stats">
                  <span>键数: {{ keysCount }}</span>
                  <span>平均TTL: {{ getAverageTtl() }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 命令统计 -->
      <el-col :span="12">
        <el-card class="metric-card">
          <template #header>
            <div class="metric-header">
              <el-icon><ant-bar-chart-outlined /></el-icon>
              <span>命令统计</span>
            </div>
          </template>
          <div v-if="redisStatus" class="redis-commandstats">
            <div class="command-stats-summary">
              <div class="summary-item">
                <span class="summary-label">总命令数:</span>
                <span class="summary-value">{{ redisStatus.commands_processed.toLocaleString() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">每秒操作:</span>
                <span class="summary-value">{{ redisPerformance ? redisPerformance.throughput : 0 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 性能监控 -->
    <el-card class="performance-card" style="margin-top: 20px">
      <template #header>
        <div class="metric-header">
          <el-icon><ant-line-chart-outlined /></el-icon>
          <span>性能监控</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div v-if="redisPerformance" class="performance-item">
            <div class="performance-label">平均延迟 (ms)</div>
            <div class="performance-value">{{ redisPerformance.latency }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div v-if="redisPerformance" class="performance-item">
            <div class="performance-label">内存碎片率</div>
            <div class="performance-value">{{ redisPerformance.memory_fragmentation }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div v-if="redisStatus" class="performance-item">
            <div class="performance-label">启动时间</div>
            <div class="performance-value">{{ formatUptime(0, redisStatus.uptime_in_seconds) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div v-if="redisPerformance" class="performance-item">
            <div class="performance-label">数据更新时间</div>
            <div class="performance-value">{{ formatTimestamp(redisPerformance.timestamp) }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElButton, ElCard, ElStatistic, ElIcon } from 'element-plus'
import { ElMessage } from 'element-plus'
import monitorAPI from '@/api/monitor'

// 模拟Redis状态数据 - 与API返回的结构匹配
const mockRedisStatus = {
  connected: true,
  version: '6.2.5',
  memory_usage: 128.5,
  memory_usage_percent: 25.3,
  clients_connected: 10,
  commands_processed: 100000,
  uptime_in_seconds: 86400,
  keyspace_hits: 95000,
  keyspace_misses: 5000,
  last_check_time: '2025-09-26 20:32:09'
}

// 模拟Redis性能数据 - 与API返回的结构匹配
const mockRedisPerformance = {
  latency: 0.5,
  throughput: 1000,
  hit_ratio: 95.0,
  memory_fragmentation: 1.1,
  db_keys: {
    'db0': 1000,
    'db1': 500
  },
  timestamp: 1758889959
}

export default {
  name: 'RedisMonitor',
  components: {
    ElButton,
    ElCard,
    ElStatistic,
    ElIcon
  },
  setup() {
    // 响应式数据
    const redisStatus = ref(null)
    const redisPerformance = ref(null)
    const loading = ref(false)
    const refreshCountdown = ref(30)
    const refreshInterval = ref(30) // 自动刷新间隔（秒）
    const countdownTimer = ref(null)
    const autoRefreshTimer = ref(null)

    // 加载Redis监控数据
    const loadRedisMonitorData = async () => {
      loading.value = true
      try {
        // 测试模式开关 - 设置为true可以使用模拟数据进行测试
        const useMockData = false
        
        if (useMockData) {
          // 模拟网络请求延迟
          await new Promise(resolve => setTimeout(resolve, 500))
          // 使用模拟数据
          redisStatus.value = mockRedisStatus
          redisPerformance.value = mockRedisPerformance
        } else {
          // 并行请求真实API数据
          await Promise.all([
            fetchRedisStatus(),
            fetchRedisPerformance()
          ])
        }
      } catch (error) {
        console.error('Failed to load Redis monitor data:', error)
        ElMessage.error('获取Redis监控数据失败')
      } finally {
        loading.value = false
      }
    }

    // 获取Redis状态数据
    const fetchRedisStatus = async () => {
      try {
        const apiData = await monitorAPI.getRedisStatus()
                
        // 记录apiData的类型和内容
                
        // 重置状态数据
        redisStatus.value = null
        
        // 处理不同格式的业务数据
        if (apiData) {
          // 1. 检查是否是标准的后端响应格{code, message, data}（如果extractData未正确处理）
          if (apiData.code !== undefined) {
                        if (apiData.code === 200 && apiData.data) {
                            // 处理data字段
              if (typeof apiData.data === 'object') {
                redisStatus.value = apiData.data
              } else {
                console.warn('Redis状态数据格式错误，data字段不是对象')
                ElMessage.warning('Redis状态数据格式错误')
              }
            } else {
              console.warn(`获取Redis状态失败 ${apiData.message || '未知错误'}`)
              ElMessage.warning(`获取Redis状态失败 ${apiData.message || '未知错误'}`)
            }
          } 
          // 2. 直接使用返回的数据（这是最常见的情况，因为apiGet已经调用了extractData）
          else if (typeof apiData === 'object') {
            redisStatus.value = apiData
          }
          // 3. 默认情况
          else {
            console.warn('获取Redis状态数据格式错误，数据不是对象')
            ElMessage.warning('Redis状态数据格式错误')
          }
        } else {
          console.warn('未获取到Redis状态数据')
          ElMessage.warning('未获取到Redis状态数据')
        }
        
        // 添加数据结构日志以便调试
        console.log('Redis status data type:', typeof redisStatus.value)
        
        // 数据适配 - 如果数据结构不匹配，尝试转换
        if (redisStatus.value) {
          redisStatus.value = adaptRedisStatusData(redisStatus.value)
        }
      } catch (error) {
        redisStatus.value = null
        console.error('Failed to fetch Redis status:', error)
        throw error
      }
    }

    // 适配Redis状态数据结构
    const adaptRedisStatusData = (data) => {
      if (!data) return null
      
      // 创建一个默认的结构框架
      const adaptedData = {
        connected: data.connected || false,
        version: data.version || '',
        memory_usage: data.memory_usage || 0,
        memory_usage_percent: data.memory_usage_percent || 0,
        clients_connected: data.clients_connected || 0,
        commands_processed: data.commands_processed || 0,
        uptime_in_seconds: data.uptime_in_seconds || 0,
        keyspace_hits: data.keyspace_hits || 0,
        keyspace_misses: data.keyspace_misses || 0,
        last_check_time: data.last_check_time || '',
        // 为了兼容原模板，添加一些必要的字段
        host: 'localhost',
        port: 6379,
        response_time: 0
      }
      
      return adaptedData
    }

    // 获取Redis性能数据
    const fetchRedisPerformance = async () => {
      try {
        const apiData = await monitorAPI.getRedisPerformance()
        
        // 记录apiData的类型和内容
        
        // 重置性能数据
        redisPerformance.value = null
        
        // 处理不同格式的业务数据
        if (apiData) {
          // 1. 检查是否是标准的后端响应格{code, message, data}（如果extractData未正确处理）
          if (apiData.code !== undefined) {
            if (apiData.code === 200 && apiData.data) {
              // 处理data字段
              if (typeof apiData.data === 'object') {
                redisPerformance.value = apiData.data
              } else {
                console.warn('Redis性能数据格式错误: data字段不是对象')
                ElMessage.warning('Redis性能数据格式错误')
              }
            } else {
              console.warn(`获取Redis性能数据失败: ${apiData.message || '未知错误'}`)
              ElMessage.warning(`获取Redis性能数据失败: ${apiData.message || '未知错误'}`)
            }
          } 
          // 2. 直接使用返回的数据（这是最常见的情况，因为apiGet已经调用了extractData）
          else if (typeof apiData === 'object') {
            redisPerformance.value = apiData
          }
          // 3. 默认情况
          else {
            console.warn('获取Redis性能数据格式错误: 数据不是对象')
            ElMessage.warning('Redis性能数据格式错误')
          }
        } else {
          console.warn('未获取到Redis性能数据')
          ElMessage.warning('未获取到Redis性能数据')
        }
        
        // 添加数据结构日志以便调试
        console.log('Redis performance data type:', typeof redisPerformance.value)
        
        // 数据适配 - 如果数据结构不匹配，尝试转换
        if (redisPerformance.value) {
          redisPerformance.value = adaptRedisPerformanceData(redisPerformance.value)
        }
      } catch (error) {
        redisPerformance.value = null
        console.error('Failed to fetch Redis performance:', error)
        throw error
      }
    }

    // 适配Redis性能数据结构
    const adaptRedisPerformanceData = (data) => {
      if (!data) return null
      
      // 创建一个默认的结构框架
      const adaptedData = {
        latency: data.latency || 0,
        throughput: data.throughput || 0,
        hit_ratio: data.hit_ratio || 0,
        memory_fragmentation: data.memory_fragmentation || 0,
        db_keys: data.db_keys || {},
        timestamp: data.timestamp || 0,
        // 为了兼容原模板，添加一些必要的字段
        memory: {
          used_memory: 0,
          used_percent: data.memory_fragmentation ? (data.memory_fragmentation * 100).toFixed(1) : 0
        },
        clients: {
          connected: 0
        },
        keyspace: {},
        stats: {
          instantaneous_ops_per_sec: data.throughput || 0
        }
      }
      
      // 转换db_keys到keyspace格式以兼容原模板
      if (data.db_keys && Object.keys(data.db_keys).length > 0) {
        for (const [dbName, keysCount] of Object.entries(data.db_keys)) {
          adaptedData.keyspace[dbName] = {
            keys: keysCount,
            avg_ttl: 0
          }
        }
      }
      
      return adaptedData
    }

    // 计算命中率
    const getHitRatio = () => {
      if (!redisStatus.value) return 0
      const total = redisStatus.value.keyspace_hits + redisStatus.value.keyspace_misses
      return total > 0 ? ((redisStatus.value.keyspace_hits / total) * 100).toFixed(1) : 0
    }

    // 格式化时间戳
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp * 1000)
      return date.toLocaleString('zh-CN')
    }

    // 刷新数据
    const refreshData = async () => {
      try {
        ElMessage.info('正在刷新数据...')
        // 重置倒计时
        resetRefreshCountdown()
        
        // 加载Redis监控数据
        await loadRedisMonitorData()
        
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
        console.error('数据刷新失败:', error)
      }
    }

    // 重置刷新倒计时
    const resetRefreshCountdown = () => {
      refreshCountdown.value = refreshInterval.value
      // 清除现有倒计时
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
      }
      
      // 启动新的倒计时
      countdownTimer.value = setInterval(() => {
        refreshCountdown.value--
        if (refreshCountdown.value <= 0) {
          clearInterval(countdownTimer.value)
        }
      }, 1000)
    }

    // 设置自动刷新
    const setupAutoRefresh = () => {
      // 清除现有定时器
      if (autoRefreshTimer.value) {
        clearInterval(autoRefreshTimer.value)
      }
      
      // 设置新的自动刷新定时器
      autoRefreshTimer.value = setInterval(() => {
        refreshData()
      }, refreshInterval.value * 1000)
    }

    // 清理所有定时器
    const cleanupTimers = () => {
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
      }
      if (autoRefreshTimer.value) {
        clearInterval(autoRefreshTimer.value)
        autoRefreshTimer.value = null
      }
    }

    // 获取客户端数量颜色
    const getClientCountColor = (count) => {
      count = count || 0
      if (count > 100) return '#f5222d' // 红色
      if (count > 50) return '#faad14' // 黄色
      return '#52c41a' // 绿色
    }

    // 获取总键数
    const getTotalKeys = () => {
      if (!redisPerformance.value || !redisPerformance.value.keyspace) return 0
      
      let total = 0
      for (const db in redisPerformance.value.keyspace) {
        if (redisPerformance.value.keyspace[db].keys) {
          total += parseInt(redisPerformance.value.keyspace[db].keys)
        }
      }
      return total
    }

    // 获取平均TTL
    const getAverageTtl = () => {
      if (!redisPerformance.value || !redisPerformance.value.keyspace) return 0
      
      let totalTtl = 0
      let totalKeys = 0
      
      for (const db in redisPerformance.value.keyspace) {
        if (redisPerformance.value.keyspace[db].avg_ttl && redisPerformance.value.keyspace[db].keys) {
          const keys = parseInt(redisPerformance.value.keyspace[db].keys)
          totalTtl += parseInt(redisPerformance.value.keyspace[db].avg_ttl) * keys
          totalKeys += keys
        }
      }
      
      return totalKeys > 0 ? Math.round(totalTtl / totalKeys) : 0
    }

    // 格式化命令名称
    const formatCommandName = (rawName) => {
      // 去除前缀cmdstat_，并转换为大写
      return rawName.replace('cmdstat_', '').toUpperCase()
    }

    // 格式化运行时间
    const formatUptime = (days, seconds) => {
      if (days > 0) {
        return `${days}${Math.floor((seconds % 86400) / 3600)}小时`
      } else if (seconds > 3600) {
        return `${Math.floor(seconds / 3600)}小时 ${Math.floor((seconds % 3600) / 60)}分钟`
      } else {
        return `${Math.floor(seconds / 60)}分钟`
      }
    }

    // 生命周期钩子
    onMounted(() => {
      // 等待DOM渲染完成
      nextTick(() => {
        // 加载数据并启动倒计时
        refreshData()
        // 设置自动刷新机制
        setupAutoRefresh()
      })
    })

    onUnmounted(() => {
      cleanupTimers()
    })

    // 暴露给模板使用的变量和方法
    return {
      redisStatus,
      redisPerformance,
      loading,
      refreshCountdown,
      refreshInterval,
      loadRedisMonitorData,
      refreshData,
      getHitRatio,
      formatTimestamp,
      getClientCountColor,
      getTotalKeys,
      getAverageTtl,
      formatCommandName,
      formatUptime
    }
  }
}
</script>

<style scoped>
.redis-monitor {
  padding: 20px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.monitor-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.refresh-controls {
  display: flex;
  align-items: center;
}

.refresh-countdown {
  font-size: 14px;
  color: #666;
  padding: 5px 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-left: 10px;
}

.metric-card {
  height: 100%;
}

.metric-header {
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.metric-header .el-icon {
  margin-right: 8px;
}

/* Redis连接状态样*/
.redis-status {
  text-align: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot.connected {
  background-color: #52c41a;
}

.status-dot.disconnected {
  background-color: #f5222d;
}

.status-text {
  font-weight: bold;
}

.connection-info {
  text-align: left;
}

.connection-info .info-item,
.redis-version-info .info-item {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

/* Redis内存使用样式 */
.redis-memory,
.redis-clients {
  text-align: center;
}

.memory-percent {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.clients-info {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* 键空间信息样*/
.redis-keyspace {
  text-align: left;
}

.keyspace-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fafafa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  align-items: center;
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-right: 4px;
}

.summary-value {
  font-size: 14px;
  font-weight: bold;
  color: #1890ff;
}

.keyspace-details {
  max-height: 200px;
  overflow-y: auto;
}

.db-item {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.db-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #333;
}

.db-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

/* 命令统计样式 */
.redis-commandstats {
  text-align: left;
}

.command-stats-list {
  max-height: 200px;
  overflow-y: auto;
}

.command-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 4px;
}

.command-name {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.command-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

/* 性能监控样式 */
.performance-card {
  margin-top: 20px;
}

.performance-item {
  text-align: center;
  padding: 10px;
}

.performance-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.performance-value {
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
}

/* 滚动条样*/
.keyspace-details::-webkit-scrollbar,
.command-stats-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.keyspace-details::-webkit-scrollbar-track,
.command-stats-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.keyspace-details::-webkit-scrollbar-thumb,
.command-stats-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.keyspace-details::-webkit-scrollbar-thumb:hover,
.command-stats-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 自动刷新控制样式 */
.refresh-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-countdown {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}
</style>
