<template>
  <div class="database-monitor">
    <div class="monitor-header">
      <h1>数据库监控</h1>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="refreshData">
          <el-icon><ant-sync-outlined /></el-icon>
          刷新数据
        </el-button>
        <span class="refresh-countdown">
          (自动刷新: {{ refreshCountdown }}s)
        </span>
      </div>
    </div>

    <!-- 数据库基本状态卡-->
    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
              <el-icon><ant-database-outlined /></el-icon>
              <span>数据库连接</span>
            </div>
          </div>
          <div class="database-info">
            <div class="database-items">
              <div class="database-item">
                <span class="database-label">当前连接数</span>
                <span class="database-value">{{ databaseStatus.connections.current }}</span>
              </div>
              <div class="database-item">
                <span class="database-label">最大连接数</span>
                <span class="database-value">{{ databaseStatus.connections.max }}</span>
              </div>
              <div class="database-item">
                <span class="database-label">连接使用率</span>
                <span class="database-value">{{ databaseStatus.connections.usage }}%</span>
              </div>
            </div>
            <div class="connection-progress">
              <el-progress :percentage="databaseStatus.connections.usage" :color="getPerformanceColor(databaseStatus.connections.usage)" />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
              <el-icon><ant-line-chart-outlined /></el-icon>
              <span>查询性能</span>
            </div>
          </div>
          <div class="query-info">
            <div class="query-items">
              <div class="query-item">
                <span class="query-label">QPS</span>
                <span class="query-value">{{ databaseStatus.query.qps }}</span>
              </div>
              <div class="query-item">
                <span class="query-label">平均响应时间</span>
                <span class="query-value">{{ databaseStatus.query.avgResponseTime }}ms</span>
              </div>
              <div class="query-item">
                <span class="query-label">慢查询数</span>
                <span class="query-value status-error">{{ databaseStatus.query.slowQueries }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
              <el-icon><ant-key-outlined /></el-icon>
              <span>事务处理</span>
            </div>
          </div>
          <div class="transaction-info">
            <div class="transaction-items">
              <div class="transaction-item">
                <span class="transaction-label">TPS</span>
                <span class="transaction-value">{{ databaseStatus.transaction.tps }}</span>
              </div>
              <div class="transaction-item">
                <span class="transaction-label">活跃事务</span>
                <span class="transaction-value">{{ databaseStatus.transaction.active }}</span>
              </div>
              <div class="transaction-item">
                <span class="transaction-label">事务成功率</span>
                <span class="transaction-value">{{ databaseStatus.transaction.successRate }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="6">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
              <el-icon><ant-table-outlined /></el-icon>
              <span>数据库空间</span>
            </div>
          </div>
          <div class="storage-info">
            <div class="storage-items">
              <div class="storage-item">
                <span class="storage-label">已用空间</span>
                <span class="storage-value">{{ formatBytes(databaseStatus.storage.used) }}</span>
              </div>
              <div class="storage-item">
                <span class="storage-label">总空间</span>
                <span class="storage-value">{{ formatBytes(databaseStatus.storage.total) }}</span>
              </div>
              <div class="storage-item">
                <span class="storage-label">空间使用率</span>
                <span class="storage-value">{{ databaseStatus.storage.usage }}%</span>
              </div>
            </div>
            <div class="storage-progress">
              <el-progress :percentage="databaseStatus.storage.usage" :color="getPerformanceColor(databaseStatus.storage.usage)" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <el-card class="chart-card">
          <div class="card-header">数据库连接趋势</div>
          <div class="chart-container">
            <div ref="connectionChart" class="chart-dom"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <el-card class="chart-card">
          <div class="card-header">查询性能趋势</div>
          <div class="chart-container">
            <div ref="queryChart" class="chart-dom"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="chart-row">
      <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <el-card class="chart-card">
          <div class="card-header">数据库空间使用</div>
          <div class="chart-container">
            <div ref="storageChart" class="chart-dom"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
        <el-card class="chart-card">
          <div class="card-header">缓存命中率</div>
          <div class="chart-container">
            <div ref="cacheChart" class="chart-dom"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据库表信息 -->
    <el-row :gutter="24" class="chart-row">
      <el-col :span="24">
        <el-card class="process-card">
          <div class="metric-header">
            <div class="metric-title">
              <el-icon><ant-table-outlined /></el-icon>
              <span>数据库表信息</span>
            </div>
            <span class="process-count">{{ tables.length }} 张表</span>
          </div>
          <div class="process-table">
            <el-table :data="tables" style="width: 100%" stripe>
              <el-table-column prop="name" label="表名" width="200" />
              <el-table-column prop="rows" label="记录数" width="100">
                <template #default="scope">
                  {{ scope.row.rows.toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="size" label="大小" width="120">
                <template #default="scope">
                  {{ formatBytes(scope.row.size) }}
                </template>
              </el-table-column>
              <el-table-column prop="engine" label="存储引擎" width="120" />
              <el-table-column prop="indexes" label="索引数" width="100" />
              <el-table-column prop="lastModified" label="最后修改时间" width="180">
                <template #default="scope">
                  {{ formatDate(new Date(scope.row.lastModified)) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import monitorApi from '../../../api/monitor.js'

// 模拟数据生成函数
const generateMockData = () => {
  // 生成随机数，在基准值附近波动
  const randomAround = (base, range) => {
    return Math.max(0, base + (Math.random() - 0.5) * range * 2)
  }
  
  // 生成模拟数据
  return {
    connections: {
      current: Math.floor(randomAround(120, 30)),
      max: 500,
      usage: Math.floor(randomAround(24, 5))
    },
    query: {
      qps: Math.floor(randomAround(1500, 500)),
      avgResponseTime: Number(randomAround(15, 5).toFixed(2)),
      slowQueries: Math.floor(randomAround(2, 2))
    },
    transaction: {
      tps: Math.floor(randomAround(300, 100)),
      active: Math.floor(randomAround(45, 15)),
      successRate: Number(randomAround(99.8, 0.2).toFixed(2))
    },
    storage: {
      used: Math.floor(randomAround(25 * 1024 * 1024 * 1024, 5 * 1024 * 1024 * 1024)), // GB
      total: 50 * 1024 * 1024 * 1024, // 50GB
      usage: 50
    },
    cache: {
      hitRate: Number(randomAround(98.5, 1.0).toFixed(2)),
      bufferPoolUsage: Number(randomAround(75, 10).toFixed(2))
    },
    status: 'running',
    type: 'MySQL',
    version: '8.0.28'
  }
}

// 生成模拟表数据
const generateMockTables = () => {
  const tableNames = [
    'users', 'orders', 'products', 'categories', 'payments',
    'logs', 'sessions', 'cart_items', 'reviews', 'settings'
  ]
  
  return tableNames.map(name => ({
    name,
    rows: Math.floor(Math.random() * 1000000) + 1000,
    size: Math.floor(Math.random() * 500 * 1024 * 1024) + 10 * 1024 * 1024, // MB
    engine: Math.random() > 0.3 ? 'InnoDB' : 'MyISAM',
    indexes: Math.floor(Math.random() * 5) + 1,
    lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }))
}

export default {
  name: 'DatabaseMonitor',
  components: {},
  setup() {
    // 数据库状态数据
    const databaseStatus = ref(generateMockData())
    
    // 数据库表信息
    const tables = ref(generateMockTables())
    
    // 数据历史记录（用于图表）
    const historyData = ref({
      timeLabels: [],
      connections: [],
      qps: [],
      storageUsed: [],
      cacheHitRate: []
    })
    
    // 图表实例
    const charts = ref({
      connectionChart: null,
      queryChart: null,
      storageChart: null,
      cacheChart: null
    })
    
    // 图表容器的引用
    const connectionChart = ref(null)
    const queryChart = ref(null)
    const storageChart = ref(null)
    const cacheChart = ref(null)
    
    // 创建chartRefs对象用于在图表初始化中统一访问
    const chartRefs = {
      get connectionChart() { return connectionChart.value },
      get queryChart() { return queryChart.value },
      get storageChart() { return storageChart.value },
      get cacheChart() { return cacheChart.value }
    }

    // 自动刷新倒计时
    const refreshCountdown = ref(0)
    const refreshInterval = 30 // 30秒自动刷新一次
    let countdownTimer = null
    let autoRefreshTimer = null

    // 获取数据库状态数据
    const fetchDatabaseStatus = async () => {
      try {
        // 尝试从API获取数据，如果失败则使用模拟数据
        const response = await monitorApi.getDatabaseStatus()
                
        // 检查响应格式并提取数据
        let apiData = null
        
        // 处理不同格式的响应
        if (response && response.data) {
          apiData = response.data
        } else {
          apiData = response
        }
        
        // 处理不同格式的业务数据
        if (apiData) {
          // 1. 检查是否是标准的后端响应格式{code, message, data}
          if (apiData.code !== undefined) {
            if (apiData.code === 200 && apiData.data) {
              processDatabaseData(apiData.data)
            } else {
              console.warn(`获取数据库状态失败: ${apiData.message || '未知错误'}`)
              ElMessage.warning(`获取数据库状态失败: ${apiData.message || '未知错误'}`)
              // 使用模拟数据
              databaseStatus.value = generateMockData()
            }
          }
          // 2. 直接处理数据对象
          else if (typeof apiData === 'object') {
            processDatabaseData(apiData)
          }
          // 3. 默认情况
          else {
            console.warn('获取数据库状态数据格式错误')
            ElMessage.warning('获取数据库状态数据格式错误')
            // 使用模拟数据
            databaseStatus.value = generateMockData()
          }
        } else {
          console.warn('未获取到数据库状态数据')
          ElMessage.warning('未获取到数据库状态数据')
          // 使用模拟数据
          databaseStatus.value = generateMockData()
        }
      } catch (error) {
        ElMessage.error('获取数据库状态失败，使用模拟数据')
        console.error('获取数据库状态失败:', error)
        // 使用模拟数据
        databaseStatus.value = generateMockData()
      }
    }
    
    // 处理数据库状态数据
    const processDatabaseData = (data) => {
      try {
        // 将后端返回的数据转换为前端期望的结构
        const formattedData = {
          connections: {
            current: data.connections || data.current_connections || 0,
            max: data.max_connections || 500,
            usage: data.connection_usage || (data.connections && data.max_connections ? Math.round((data.connections / data.max_connections) * 100) : 0)
          },
          query: {
            qps: data.qps || data.queries_per_second || 0,
            avgResponseTime: data.avg_query_time || 0,
            slowQueries: data.slow_queries || 0
          },
          transaction: {
            tps: data.tps || data.transactions_per_second || 0,
            active: data.active_transactions || 0,
            successRate: data.transaction_success_rate || 0
          },
          storage: {
            used: data.data_size || 0,
            total: data.total_data_size || 0,
            usage: data.data_size_percent || (data.data_size && data.total_data_size ? Math.round((data.data_size / data.total_data_size) * 100) : 0)
          },
          cache: {
            hitRate: data.cache_hit_rate || 0,
            bufferPoolUsage: data.buffer_pool_usage || 0
          },
          status: data.status || 'running',
          type: data.db_type || 'MySQL',
          version: data.version || 'Unknown'
        }
        
        databaseStatus.value = formattedData
      } catch (error) {
        console.error('处理数据库状态数据失败:', error)
        ElMessage.error('处理数据库状态数据失败')
        // 使用模拟数据
        databaseStatus.value = generateMockData()
      }
    }

    // 获取数据库表信息
    const getDatabaseTables = async () => {
      try {
        // 尝试从API获取数据，如果失败则使用模拟数据
        const response = await monitorApi.getDatabaseTables()
        
        let tableData = []
        if (response && response.code === 200) {
          tableData = response.data || []
        } else if (response && response.data) {
          tableData = response.data || []
        } else if (Array.isArray(response)) {
          tableData = response
        }
        
        if (tableData.length > 0) {
          // 格式化表数据
          tables.value = tableData.map(table => ({
            name: table.name || '',
            rows: table.rows || 0,
            size: table.size || 0,
            engine: table.engine || '',
            indexes: table.indexes || 0,
            lastModified: table.last_modified || new Date().toISOString()
          }))
                  } else {
          // 如果没有获取到数据，提供模拟数据
                    tables.value = generateMockTables()
        }
      } catch (error) {
        console.error('获取数据库表信息失败:', error)
        // API调用失败时提供模拟数据
        tables.value = generateMockTables()
        ElMessage.warning('当前使用模拟表数据')
      }
    }

    // 添加新的历史数据
    const addHistoryData = () => {
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      
      // 保持最新60个数据点
      const maxDataPoints = 60
      
      // 添加新的数据点
      historyData.value.timeLabels.push(timeStr)
      historyData.value.connections.push(databaseStatus.value.connections.current)
      historyData.value.qps.push(databaseStatus.value.query.qps)
      historyData.value.storageUsed.push(databaseStatus.value.storage.used)
      historyData.value.cacheHitRate.push(databaseStatus.value.cache.hitRate)
      
      // 如果数据点超过最大值，删除最旧的
      if (historyData.value.timeLabels.length > maxDataPoints) {
        historyData.value.timeLabels.shift()
        historyData.value.connections.shift()
        historyData.value.qps.shift()
        historyData.value.storageUsed.shift()
        historyData.value.cacheHitRate.shift()
      }
      
      // 更新所有图表
      updateCharts()
    }
    
    // 初始化连接数图表
    const initConnectionChart = () => {
      if (chartRefs.connectionChart && !charts.value.connectionChart) {
        charts.value.connectionChart = echarts.init(chartRefs.connectionChart)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>连接 {c}'
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: historyData.value.timeLabels,
            axisLabel: {
              fontSize: 10,
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            name: '连接数',
            min: 0
          },
          series: [{
            name: '连接数',
            type: 'line',
            smooth: true,
            data: historyData.value.connections,
            lineStyle: {
              width: 2,
              color: '#409EFF'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
              ])
            },
            markLine: {
              silent: true,
              lineStyle: {
                color: '#999'
              },
              data: [
                { yAxis: databaseStatus.value.connections.max * 0.7, name: '警告阈0%', lineStyle: { color: '#ffba00' } },
                { yAxis: databaseStatus.value.connections.max * 0.9, name: '危险阈0%', lineStyle: { color: '#ff4949' } }
              ]
            }
          }]
        }
        
        charts.value.connectionChart.setOption(option)
      }
    }
    
    // 初始化查询性能图表
    const initQueryChart = () => {
      if (chartRefs.queryChart && !charts.value.queryChart) {
        charts.value.queryChart = echarts.init(chartRefs.queryChart)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              let result = params[0].name + '<br/>'
              params.forEach(item => {
                if (item.seriesName === 'QPS') {
                  result += `${item.seriesName}: ${item.value}<br/>`
                } else {
                  result += `${item.seriesName}: ${item.value}ms<br/>`
                }
              })
              return result
            }
          },
          legend: {
            data: ['QPS', '平均响应时间'],
            top: 0
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true,
            top: '15%'
          },
          xAxis: {
            type: 'category',
            data: historyData.value.timeLabels,
            axisLabel: {
              fontSize: 10,
              rotate: 45
            }
          },
          yAxis: [
            {
              type: 'value',
              name: 'QPS',
              position: 'left',
              min: 0
            },
            {
              type: 'value',
              name: '响应时间(ms)',
              position: 'right',
              min: 0,
              max: 100
            }
          ],
          series: [
            {
              name: 'QPS',
              type: 'line',
              smooth: true,
              data: historyData.value.qps,
              lineStyle: {
                width: 2,
                color: '#13ce66'
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(19, 206, 102, 0.3)' },
                  { offset: 1, color: 'rgba(19, 206, 102, 0.1)' }
                ])
              }
            },
            {
              name: '平均响应时间',
              type: 'line',
              smooth: true,
              data: historyData.value.qps.map(qps => Math.max(1, Math.min(50, 10000 / qps))), // 模拟响应时间
              lineStyle: {
                width: 2,
                color: '#ff4949'
              },
              yAxisIndex: 1
            }
          ]
        }
        
        charts.value.queryChart.setOption(option)
      }
    }
    
    // 初始化存储图表
    const initStorageChart = () => {
      if (chartRefs.storageChart && !charts.value.storageChart) {
        charts.value.storageChart = echarts.init(chartRefs.storageChart)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              return `${params[0].name}<br/>已用空间: ${formatBytes(params[0].value)}`
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: historyData.value.timeLabels,
            axisLabel: {
              fontSize: 10,
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            name: '空间使用',
            min: 0,
            axisLabel: {
              formatter: function(value) {
                return formatBytes(value)
              }
            }
          },
          series: [{
            name: '已用空间',
            type: 'line',
            smooth: true,
            data: historyData.value.storageUsed,
            lineStyle: {
              width: 2,
              color: '#ff7e4a'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 126, 74, 0.3)' },
                { offset: 1, color: 'rgba(255, 126, 74, 0.1)' }
              ])
            },
            markLine: {
              silent: true,
              lineStyle: {
                color: '#999'
              },
              data: [
                { yAxis: databaseStatus.value.storage.total * 0.7, name: '警告阈0%', lineStyle: { color: '#ffba00' } },
                { yAxis: databaseStatus.value.storage.total * 0.9, name: '危险阈0%', lineStyle: { color: '#ff4949' } }
              ]
            }
          }]
        }
        
        charts.value.storageChart.setOption(option)
      }
    }
    
    // init cache chart
    const initCacheChart = () => {
      if (chartRefs.cacheChart && !charts.value.cacheChart) {
        charts.value.cacheChart = echarts.init(chartRefs.cacheChart)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>缓存命中 {c}%'
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: historyData.value.timeLabels,
            axisLabel: {
              fontSize: 10,
              rotate: 45
            }
          },
          yAxis: {
            type: 'value',
            name: '命中%)',
            min: 90,
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            }
          },
          series: [{
            name: '缓存命中率',
            type: 'line',
            smooth: true,
            data: historyData.value.cacheHitRate,
            lineStyle: {
              width: 2,
              color: '#52c41a'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
              ])
            },
            markLine: {
              silent: true,
              lineStyle: {
                color: '#999'
              },
              data: [
                { yAxis: 95, name: '警告阈5%', lineStyle: { color: '#ffba00' } },
                { yAxis: 90, name: '危险阈0%', lineStyle: { color: '#ff4949' } }
              ]
            }
          }]
        }
        
        charts.value.cacheChart.setOption(option)
      }
    }
    
    // 在基准值周围生成随机数的函数
    const randomAround = (base, range) => {
      return base + (Math.random() * range * 2 - range)
    }
    
    // 初始化所有图表
    const initCharts = () => {
      // 如果历史数据为空，添加一些模拟数据点以确保图表首次渲染时有内容显示
      if (historyData.value.timeLabels.length === 0) {
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 1000 * 30)
          const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`
          
          historyData.value.timeLabels.push(timeStr)
          historyData.value.connections.push(Math.floor(randomAround(databaseStatus.value.connections.current, 20)))
          historyData.value.qps.push(Math.floor(randomAround(databaseStatus.value.query.qps, 300)))
          historyData.value.storageUsed.push(Math.floor(randomAround(databaseStatus.value.storage.used, 1073741824)))
          historyData.value.cacheHitRate.push(Number(randomAround(databaseStatus.value.cache.hitRate, 1.0).toFixed(2)))
        }
      }
      
      initConnectionChart()
      initQueryChart()
      initStorageChart()
      initCacheChart()
    }
    
    // 更新所有图表
    const updateCharts = () => {
      if (charts.value.connectionChart) {
        charts.value.connectionChart.setOption({
          xAxis: { data: historyData.value.timeLabels },
          series: [{ data: historyData.value.connections }]
        })
      }
      
      if (charts.value.queryChart) {
        charts.value.queryChart.setOption({
          xAxis: { data: historyData.value.timeLabels },
          series: [
            { data: historyData.value.qps },
            { data: historyData.value.qps.map(qps => Math.max(1, Math.min(50, 10000 / qps))) }
          ]
        })
      }
      
      if (charts.value.storageChart) {
        charts.value.storageChart.setOption({
          xAxis: { data: historyData.value.timeLabels },
          series: [{ data: historyData.value.storageUsed }]
        })
      }
      
      if (charts.value.cacheChart) {
        charts.value.cacheChart.setOption({
          xAxis: { data: historyData.value.timeLabels },
          series: [{ data: historyData.value.cacheHitRate }]
        })
      }
    }
    
    // 刷新所有数据
    const refreshData = async () => {
      try {
        ElMessage.info('正在刷新数据...')
        // 重置倒计时
        resetRefreshCountdown()
        
        // 并行获取所有数据
        await Promise.all([
          fetchDatabaseStatus(),
          getDatabaseTables()
        ])
        
        // 添加新的历史数据
        addHistoryData()
        
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
        console.error('数据刷新失败:', error)
      }
    }

    // 重置刷新倒计时
    const resetRefreshCountdown = () => {
      refreshCountdown.value = refreshInterval
      
      // 清除现有倒计时
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
      
      // 启动新的倒计时
      countdownTimer = setInterval(() => {
        refreshCountdown.value--
        if (refreshCountdown.value <= 0) {
          clearInterval(countdownTimer)
        }
      }, 1000)
    }

    // 格式化字节大小
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 格式化日期
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    // 获取性能颜色
    const getPerformanceColor = (percent) => {
      if (percent < 70) {
        return '#13ce66' // 绿色
      } else if (percent < 90) {
        return '#ffba00' // 黄色
      } else {
        return '#ff4949' // 红色
      }
    }

    // 设置自动刷新
    const setupAutoRefresh = () => {
      // 清除现有定时器
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
      }
      
      // 设置新的自动刷新定时器
      autoRefreshTimer = setInterval(() => {
        refreshData()
      }, refreshInterval * 1000)
    }

    // 处理窗口大小变化
    const handleResize = () => {
      if (charts.value.connectionChart) {
        charts.value.connectionChart.resize()
      }
      if (charts.value.queryChart) {
        charts.value.queryChart.resize()
      }
      if (charts.value.storageChart) {
        charts.value.storageChart.resize()
      }
      if (charts.value.cacheChart) {
        charts.value.cacheChart.resize()
      }
    }

    // 组件挂载时初始化数据和图表
    onMounted(() => {
      // 等待DOM渲染完成
      nextTick(() => {
        // 先初始化图表（使用模拟数据）
        initCharts()
        
        // 加载实际数据
        refreshData()
        
        // 设置自动刷新
        setupAutoRefresh()
        
        // 监听窗口大小变化，重绘图表
        window.addEventListener('resize', handleResize)
      })
    })

    // 组件卸载时清理资源
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
      }
      
      // 销毁所有图表实例
      if (charts.value.connectionChart) {
        charts.value.connectionChart.dispose()
        charts.value.connectionChart = null
      }
      if (charts.value.queryChart) {
        charts.value.queryChart.dispose()
        charts.value.queryChart = null
      }
      if (charts.value.storageChart) {
        charts.value.storageChart.dispose()
        charts.value.storageChart = null
      }
      if (charts.value.cacheChart) {
        charts.value.cacheChart.dispose()
        charts.value.cacheChart = null
      }
      
      // 移除窗口大小变化监听
      window.removeEventListener('resize', handleResize)
    })

    return {
      databaseStatus,
      tables,
      refreshCountdown,
      refreshData,
      formatBytes,
      formatDate,
      getPerformanceColor,
      chartRefs,
      connectionChart,
      queryChart,
      storageChart,
      cacheChart
    }
  }
}
</script>

<style scoped>
.database-monitor {
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
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-countdown {
  font-size: 12px;
  color: #606266;
}

/* 图表卡片样式 */
.chart-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-dom {
  width: 100%;
  height: 100%;
}

/* 指标卡片样式 */
.metric-card {
  height: 100%;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.metric-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

/* 数据库信息样*/
.database-info, .query-info, .transaction-info, .storage-info {
  padding: 10px 0;
}

.database-items, .query-items, .transaction-items, .storage-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.database-item, .query-item, .transaction-item, .storage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.database-label, .query-label, .transaction-label, .storage-label {
  font-size: 12px;
  color: #606266;
}

.database-value, .query-value, .transaction-value, .storage-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.status-running {
  color: #13ce66;
}

.status-error {
  color: #ff4949;
}

/* 进度条样*/
.connection-progress, .storage-progress {
  margin-top: 10px;
}

/* 表格样式 */
.process-card {
  margin-top: 20px;
}

.process-count {
  font-size: 12px;
  color: #606266;
}

.process-table {
  margin-top: 10px;
}

/* 响应式布局调整 */
@media (max-width: 1200px) {
  .el-col {
    margin-bottom: 20px;
  }
}

/* 图表区域的行间距调整 */
.el-row.chart-row {
  margin-bottom: 24px;
}

/* 确保不同图表行之间的垂直间距一*/
.chart-row:not(:last-child) {
  margin-bottom: 24px !important;
}
</style>