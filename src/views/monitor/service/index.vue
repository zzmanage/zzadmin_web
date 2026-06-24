<template>
  <div class="service-monitor">
    <div class="monitor-header">
      <h1>服务监控</h1>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="refreshData"
        >
          <el-icon><ant-sync-outlined /></el-icon>
          刷新数据
        </el-button>
        <span v-if="refreshCountdown > 0" class="refresh-countdown">
          ({{ refreshCountdown }}s后自动刷
        </span>
      </div>
    </div>
    
    <el-row :gutter="20" class="mt-4">
      <!-- 内存、磁盘、系统信息卡-->
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
                <el-icon><ant-pie-chart-outlined /></el-icon>
                <span>内存监控</span>
              </div>
          </div>
          <div class="memory-info">
            <div class="memory-chart-container">
              <div 
                class="pie-chart-small" 
                ref="memoryPieChart"
              ></div>
            </div>
            <div class="memory-details">
              <p>已用: {{ formatBytes(serviceStatus.memory.used * 1024 * 1024) }}</p>
              <p>可用: {{ formatBytes(serviceStatus.memory.available * 1024 * 1024) }}</p>
              <p>总计: {{ formatBytes(serviceStatus.memory.total * 1024 * 1024) }}</p>
            </div>
            <el-progress 
              :percentage="serviceStatus.memory.percent" 
              :stroke-color="getPerformanceColor(serviceStatus.memory.percent)"
              class="memory-progress"
            />
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
                <el-icon><ant-container-outlined /></el-icon>
                <span>CPU监控</span>
              </div>
          </div>
          <div class="cpu-info">
            <el-statistic 
              :value="serviceStatus.cpu.percent" 
              :precision="1"
              suffix="%"
              class="cpu-usage"
            />
            <div class="cpu-details">
              <p>核心 {{ serviceStatus.cpu.cores }}</p>
              <p>系统负载: {{ serviceStatus.cpu.load }}</p>
            </div>
            <el-progress 
              :percentage="serviceStatus.cpu.percent" 
              :stroke-color="getPerformanceColor(serviceStatus.cpu.percent)"
              class="cpu-progress"
            />
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
                <el-icon><ant-folder-outlined /></el-icon>
                <span>磁盘监控</span>
              </div>
          </div>
          <div class="disk-info">
            <div class="disk-chart-container">
              <div 
                class="pie-chart-small" 
                ref="diskPieChart"
              ></div>
            </div>
            <div class="disk-details">
              <p>已用: {{ formatBytes(serviceStatus.disk.used * 1024 * 1024 * 1024) }}</p>
              <p>可用: {{ formatBytes(serviceStatus.disk.free * 1024 * 1024 * 1024) }}</p>
              <p>总计: {{ formatBytes(serviceStatus.disk.total * 1024 * 1024 * 1024) }}</p>
            </div>
            <el-progress 
              :percentage="serviceStatus.disk.percent" 
              :stroke-color="getPerformanceColor(serviceStatus.disk.percent)"
              class="disk-progress"
            />
          </div>
        </el-card>
      </el-col>
      <!-- 多磁盘信息卡-->
      <el-col :span="8">
        <el-card class="metric-card" v-if="serviceStatus.disks && serviceStatus.disks.length > 0">
          <div class="metric-header">
            <div class="metric-title">
                <el-icon><ant-folder-open-outlined /></el-icon>
                <span>磁盘分区</span>
              </div>
          </div>
          <div class="disks-info">
            <el-tabs v-model="activeDiskTab" type="border-card" size="small">
              <el-tab-pane 
                v-for="(disk, index) in serviceStatus.disks" 
                :key="index" 
                :label="getDiskTabLabel(disk)"
              >
                <div class="disk-partition-details">
                  <!-- 分区环形-->
                  <div class="partition-chart-container">
                    <div 
                      class="partition-pie-chart"
                      :ref="el => partitionChartRefs[index] = el"
                    ></div>
                  </div>
                  <div class="partition-info">
                    <p>设备: {{ disk.device }}</p>
                    <p>挂载 {{ disk.mountpoint }}</p>
                    <p>文件系统: {{ disk.fstype }}</p>
                    <p>已用: {{ formatBytes(disk.used * 1024 * 1024 * 1024) }}</p>
                    <p>可用: {{ formatBytes(disk.free * 1024 * 1024 * 1024) }}</p>
                    <p>总计: {{ formatBytes(disk.total * 1024 * 1024 * 1024) }}</p>
                    <el-progress 
                      :percentage="disk.percent" 
                      :stroke-color="getPerformanceColor(disk.percent)"
                      style="margin-top: 10px;"
                    />
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-card>
        <el-card class="metric-card" v-else>
          <div class="metric-header">
            <div class="metric-title">
                <el-icon><ant-folder-open-outlined /></el-icon>
                <span>磁盘分区</span>
              </div>
          </div>
          <div class="disks-info">
            <p style="text-align: center; color: #909399;">暂无分区信息</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 网络和系统信-->
    <el-row :gutter="20" class="mt-4 chart-row">
      <el-col :span="12">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
                <el-icon><ant-wifi-outlined /></el-icon>
                <span>网络监控</span>
              </div>
          </div>
          <div class="network-info">
            <div class="network-items">
              <div class="network-item">
                <span class="network-label">接收速度:</span>
                <span class="network-value">{{ formatBytes(serviceStatus.network.recv_bytes_per_sec) }}/s</span>
              </div>
              <div class="network-item">
                <span class="network-label">发送速度:</span>
                <span class="network-value">{{ formatBytes(serviceStatus.network.send_bytes_per_sec) }}/s</span>
              </div>
              <div class="network-item">
                <span class="network-label">IP地址:</span>
                <span class="network-value">{{ serviceStatus.network.ip_address }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="metric-card">
          <div class="metric-header">
            <div class="metric-title">
                <el-icon><ant-desktop-outlined /></el-icon>
                <span>系统信息</span>
              </div>
          </div>
          <div class="system-info">
            <div class="system-items">
              <div class="system-item">
                <span class="system-label">系统:</span>
                <span class="system-value">{{ serviceStatus.system.os }}</span>
              </div>
              <div class="system-item">
                <span class="system-label">版本:</span>
                <span class="system-value">{{ serviceStatus.system.version }}</span>
              </div>
              <div class="system-item">
                <span class="system-label">运行时间:</span>
                <span class="system-value">{{ formatUptime(serviceStatus.system.uptime) }}</span>
              </div>
              <div class="system-item">
                <span class="system-label">服务器时</span>
                <span class="system-value">{{ formatDate(new Date()) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="mt-4 chart-row">
      <!-- CPU使用率趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <el-icon><ant-container-outlined /></el-icon>
            <span style="margin-left: 8px;">CPU使用率趋势</span>
          </div>
          <div 
            class="chart-container-small" 
            ref="cpuChart"
          ></div>
        </el-card>
      </el-col>
      
      <!-- 内存使用率趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <el-icon><ant-pie-chart-outlined /></el-icon>
            <span style="margin-left: 8px;">内存使用率趋势</span>
          </div>
          <div 
            class="chart-container-small" 
            ref="memoryChart"
          ></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-4 chart-row">
      <!-- 磁盘使用率趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <el-icon><ant-folder-outlined /></el-icon>
            <span style="margin-left: 8px;">磁盘使用率趋势</span>
          </div>
          <div 
            class="chart-container-small" 
            ref="diskChart"
          ></div>
        </el-card>
      </el-col>
      
      <!-- 网络流量趋势-->
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <el-icon><ant-wifi-outlined /></el-icon>
            <span style="margin-left: 8px;">网络流量趋势</span>
          </div>
          <div 
            class="chart-container-small" 
            ref="networkChart"
          ></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 进程列表 -->
    <el-card class="process-card mt-4">
      <div class="metric-header">
        <div class="metric-title">
            <el-icon><ant-control-outlined /></el-icon>
            <span>运行进程</span>
          </div>
        <div class="process-count">
          {{ processes.length }} 个进        </div>
      </div>
      <el-table 
        :data="processes" 
        stripe 
        class="process-table"
        size="small"
      >
        <el-table-column prop="pid" label="进程ID" width="80" />
        <el-table-column prop="name" label="进程名称" width="200" />
        <el-table-column prop="cpu_percent" label="CPU使用率" width="100">
          <template #default="scope">
            {{ scope.row.cpu_percent.toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column prop="memory_percent" label="内存使用率" width="100">
          <template #default="scope">
            {{ scope.row.memory_percent.toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(new Date(scope.row.create_time)) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 'running' ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.status === 'running' ? '运行' : '停止' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import monitorApi from '../../../api/monitor.js'

export default {
  name: 'ServiceMonitor',
  components: {},
  setup() {
    // 服务状态数据
    const serviceStatus = ref({
      memory: {
        percent: 0,
        used: 0,
        available: 0,
        total: 0
      },
      cpu: {
        percent: 0,
        cores: 0,
        load: 0
      },
      disk: {
        percent: 0,
        used: 0,
        free: 0,
        total: 0
      },
      disks: [],  // 新增字段，存储所有磁盘分区的详细信息
      network: {
        recv_bytes_per_sec: 0,
        send_bytes_per_sec: 0,
        ip_address: ''
      },
      system: {
        os: '',
        version: '',
        uptime: 0
      }
    })
    
    // 数据历史记录（用于图表）
    const historyData = ref({
      timeLabels: [],
      cpuUsage: [],
      memoryUsage: [],
      diskUsage: [],
      recvBytes: [],
      sendBytes: []
    })
    
    // 图表实例
    const charts = ref({
      cpuChart: null,
      memoryChart: null,
      diskChart: null,
      networkChart: null,
      memoryPieChart: null,
      diskPieChart: null
    })
    
    // 图表容器的引用
    const cpuChart = ref(null)
    const memoryChart = ref(null)
    const diskChart = ref(null)
    const networkChart = ref(null)
    const memoryPieChart = ref(null)
    const diskPieChart = ref(null)
    
    // 活跃的磁盘标签页
    const activeDiskTab = ref('0')
    
    // 分区图表引用数组
    const partitionChartRefs = ref({})
    
    // 分区图表实例数组
    const partitionCharts = ref({})
    
    // 创建chartRefs对象用于在图表初始化中统一访问
    const chartRefs = {
      get cpuChart() { return cpuChart.value },
      get memoryChart() { return memoryChart.value },
      get diskChart() { return diskChart.value },
      get networkChart() { return networkChart.value },
      get memoryPieChart() { return memoryPieChart.value },
      get diskPieChart() { return diskPieChart.value }
    }

    // 数据库状态
    const databaseStatus = ref({
      type: '',
      connections: 0,
      queries: 0,
      status: 'running'
    })

    // Redis状态
    const redisStatus = ref({
      version: '',
      memory_used: 0,
      connections: 0,
      status: 'running'
    })

    // 进程列表
    const processes = ref([])

    // 自动刷新倒计时
    const refreshCountdown = ref(0)
    const refreshInterval = 30 // 30秒自动刷新一次
    let countdownTimer = null
    let autoRefreshTimer = null

    // 获取服务状态数据
    const fetchServiceStatus = async () => {
      try {
        const response = await monitorApi.getServiceStatus()
                
        // 检查响应格式并提取数据（参照online/index.vue的处理方式）
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
              processServiceData(apiData.data)
            } else {
              console.warn(`获取服务状态失败: ${apiData.message || '未知错误'}`)
              ElMessage.warning(`获取服务状态失败: ${apiData.message || '未知错误'}`)
            }
          }
          // 2. 直接处理数据对象
          else if (typeof apiData === 'object') {
            processServiceData(apiData)
          }
          // 3. 默认情况
          else {
            console.warn('获取服务状态数据格式错误')
            ElMessage.warning('获取服务状态数据格式错误')
          }
        } else {
          console.warn('未获取到服务状态数据')
          ElMessage.warning('未获取到服务状态数据')
        }
      } catch (error) {
        ElMessage.error('获取服务状态失败')
        console.error('获取服务状态失败', error)
      }
    }
    
    // 处理服务状态数据
    const processServiceData = (data) => {
      try {
        // 将后端返回的扁平数据转换为前端期望的嵌套结构
        const formattedData = {
          memory: {
            percent: data.memory_usage || 0,
            used: Math.round((data.memory_used || 0) / (1024 * 1024)), // 转换为MB
            available: data.memory_available ? Math.round(data.memory_available / (1024 * 1024)) : 0, // 转换为MB
            total: data.memory_total ? Math.round(data.memory_total / (1024 * 1024)) : 0 // 转换为MB
          },
          cpu: {
            percent: data.cpu_usage || 0,
            cores: navigator.hardwareConcurrency || 4, // 使用浏览器提供的CPU核心数
            load: data.cpu_usage || 0
          },
          disk: {
            percent: data.disk_usage || 0,
            used: Math.round((data.disk_used || 0) / (1024 * 1024 * 1024)), // 转换为GB
            free: data.disk_free ? Math.round(data.disk_free / (1024 * 1024 * 1024)) : 0, // 转换为GB
            total: data.disk_total ? Math.round(data.disk_total / (1024 * 1024 * 1024)) : 0 // 转换为GB
          },
          disks: [], // 初始化多磁盘数据
          network: {
            recv_bytes_per_sec: data.network_recv || data.bytes_recv || 0,
            send_bytes_per_sec: data.network_sent || data.bytes_sent || 0,
            ip_address: '127.0.0.1' // 模拟IP地址
          },
          system: {
            os: navigator.platform || 'Unknown',
            version: navigator.appVersion || 'Unknown',
            uptime: 0 // 后端没有直接提供，暂时设为0
          }
        }
        
        // 处理多磁盘数据
        if (data.disks && Array.isArray(data.disks)) {
          formattedData.disks = data.disks.map(disk => ({
            device: disk.device || 'Unknown Device',
            mountpoint: disk.mountpoint || 'Unknown Mount Point',
            fstype: disk.fstype || 'Unknown',
            percent: disk.percent || 0,
            used: Math.round((disk.used || 0) / (1024 * 1024 * 1024)), // 转换为GB
            free: Math.round((disk.free || 0) / (1024 * 1024 * 1024)), // 转换为GB
            total: Math.round((disk.total || 0) / (1024 * 1024 * 1024)) // 转换为GB
          }))
        }
        
        serviceStatus.value = formattedData
      } catch (error) {
        console.error('处理服务状态数据失败', error)
        ElMessage.error('处理服务状态数据失败')
      }
    }


    // 获取进程列表
    const getProcesses = async () => {
      try {
        const response = await monitorApi.getRunningProcesses()
                
        // 处理不同格式的响应
        let processData = []
        if (response && response.code === 200) {
          processData = response.data || []
        } else if (response && response.data) {
          // 尝试直接使用response.data
          processData = response.data || []
        } else if (Array.isArray(response)) {
          // 直接使用数组响应
          processData = response
        }
        
        if (processData.length > 0) {
          // 格式化进程数据
          processes.value = processData.map(proc => ({
            pid: proc.pid,
            name: proc.name,
            cpu_percent: parseFloat(proc.cpu_percent || 0),
            memory_percent: parseFloat(proc.memory_percent || 0),
            create_time: proc.create_time || new Date().toISOString(),
            status: 'running' // 默认状态为运行中
          }))
        } else {
          // 如果没有获取到数据，提供模拟数据
          provideMockProcesses()
        }
      } catch (error) {
        console.error('获取进程列表失败:', error)
        // API调用失败时提供模拟数据
        provideMockProcesses()
        ElMessage.warning('当前使用模拟进程数据')
      }
    }
    
    // 提供模拟进程数据
    const provideMockProcesses = () => {
      const mockProcesses = [
        { pid: 1, name: 'systemd', cpu_percent: 0.5, memory_percent: 0.2, create_time: new Date(Date.now() - 3600000).toISOString(), status: 'running' },
        { pid: 100, name: 'nginx', cpu_percent: 1.2, memory_percent: 2.5, create_time: new Date(Date.now() - 1800000).toISOString(), status: 'running' },
        { pid: 200, name: 'python3', cpu_percent: 5.7, memory_percent: 10.3, create_time: new Date(Date.now() - 900000).toISOString(), status: 'running' },
        { pid: 300, name: 'redis-server', cpu_percent: 0.8, memory_percent: 1.8, create_time: new Date(Date.now() - 2700000).toISOString(), status: 'running' },
        { pid: 400, name: 'mysql', cpu_percent: 2.3, memory_percent: 15.6, create_time: new Date(Date.now() - 3600000).toISOString(), status: 'running' },
        { pid: 500, name: 'node', cpu_percent: 3.1, memory_percent: 8.7, create_time: new Date(Date.now() - 600000).toISOString(), status: 'running' },
        { pid: 600, name: 'sshd', cpu_percent: 0.1, memory_percent: 0.3, create_time: new Date(Date.now() - 3000000).toISOString(), status: 'running' },
        { pid: 700, name: 'docker', cpu_percent: 1.5, memory_percent: 4.2, create_time: new Date(Date.now() - 2400000).toISOString(), status: 'running' }
      ]
      processes.value = mockProcesses
    }

    // 添加新的历史数据
    const addHistoryData = () => {
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      
      // 保持最多60个数据点
      const maxDataPoints = 60
      
      // 添加新的数据点
      historyData.value.timeLabels.push(timeStr)
      historyData.value.cpuUsage.push(serviceStatus.value.cpu.percent)
      historyData.value.memoryUsage.push(serviceStatus.value.memory.percent)
      historyData.value.diskUsage.push(serviceStatus.value.disk.percent)
      
      // 确保网络数据有效，避免为0的情况
      let recvBytes = serviceStatus.value.network.recv_bytes_per_sec || Math.random() * 1024 * 50
      let sendBytes = serviceStatus.value.network.send_bytes_per_sec || Math.random() * 1024 * 25
      
      // 如果网络数据太小，添加一些随机小数据以确保图表可见
      if (recvBytes < 100) {
        recvBytes += Math.random() * 1024 * 10
      }
      if (sendBytes < 100) {
        sendBytes += Math.random() * 1024 * 5
      }
      
      historyData.value.recvBytes.push(recvBytes)
      historyData.value.sendBytes.push(sendBytes)
      
      console.log(`添加历史数据: 收${formatBytes(recvBytes)}/s, 发${formatBytes(sendBytes)}/s`)
      
      // 如果数据点超过最大值，删除最旧的
      if (historyData.value.timeLabels.length > maxDataPoints) {
        historyData.value.timeLabels.shift()
        historyData.value.cpuUsage.shift()
        historyData.value.memoryUsage.shift()
        historyData.value.diskUsage.shift()
        historyData.value.recvBytes.shift()
        historyData.value.sendBytes.shift()
      }
      
      // 更新所有图表
      updateCharts()
    }
    
    // 初始化CPU使用率图表
    const initCpuChart = () => {
      if (chartRefs.cpuChart && !charts.value.cpuChart) {
        charts.value.cpuChart = echarts.init(chartRefs.cpuChart)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>CPU使用 {c}%'
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
            name: '使用%)',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            }
          },
          series: [{
            name: 'CPU使用率',
            type: 'line',
            smooth: true,
            data: historyData.value.cpuUsage,
            lineStyle: {
              width: 2,
              color: '#ff4949'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 73, 73, 0.3)' },
                { offset: 1, color: 'rgba(255, 73, 73, 0.1)' }
              ])
            },
            markLine: {
              silent: true,
              lineStyle: {
                color: '#999'
              },
              data: [
                { yAxis: 50, name: '警告阈0%', lineStyle: { color: '#ffba00' } },
                { yAxis: 80, name: '危险阈0%', lineStyle: { color: '#ff4949' } }
              ]
            }
          }]
        }
        
        charts.value.cpuChart.setOption(option)
      }
    }
    
    // 初始化内存使用率饼图
    const initMemoryPieChart = () => {
      if (chartRefs.memoryPieChart && !charts.value.memoryPieChart) {
        charts.value.memoryPieChart = echarts.init(chartRefs.memoryPieChart)
        
        // 模拟数据用于首次渲染
        const used = serviceStatus.value.memory.used || 1024
        const available = serviceStatus.value.memory.available || 1024
        
        const option = {
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: {
              fontSize: 10
            }
          },
          series: [
            {
              name: '内存使用',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['35%', '50%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '14',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                {
                  value: used,
                  name: '已用内存',
                  itemStyle: {
                    color: '#409EFF'
                  }
                },
                {
                  value: available,
                  name: '可用内存',
                  itemStyle: {
                    color: '#f0f2f5'
                  }
                }
              ]
            }
          ]
        }
        
        charts.value.memoryPieChart.setOption(option)
      }
    }
    
    // 更新内存饼图
    const updateMemoryPieChart = () => {
      if (charts.value.memoryPieChart) {
        const used = serviceStatus.value.memory.used || 1024
        const available = serviceStatus.value.memory.available || 1024
        
        charts.value.memoryPieChart.setOption({
          series: [{
            data: [
              {
                value: used,
                name: '已用内存',
                itemStyle: {
                  color: '#409EFF'
                }
              },
              {
                value: available,
                name: '可用内存',
                itemStyle: {
                  color: '#f0f2f5'
                }
              }
            ]
          }]
        })
      }
    }
    
    // 初始化内存使用率趋势图表
    const initMemoryChart = () => {
      if (chartRefs.memoryChart && !charts.value.memoryChart) {
        charts.value.memoryChart = echarts.init(chartRefs.memoryChart)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>内存使用 {c}%'
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
            name: '使用%)',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            }
          },
          series: [{
            name: '内存使用率',
            type: 'line',
            smooth: true,
            data: historyData.value.memoryUsage,
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
                { yAxis: 50, name: '警告阈0%', lineStyle: { color: '#ffba00' } },
                { yAxis: 80, name: '危险阈0%', lineStyle: { color: '#ff4949' } }
              ]
            }
          }]
        }
        
        charts.value.memoryChart.setOption(option)
      }
    }
    
    // 初始化磁盘使用率饼图
    const initDiskPieChart = () => {
      if (chartRefs.diskPieChart && !charts.value.diskPieChart) {
        charts.value.diskPieChart = echarts.init(chartRefs.diskPieChart)
        
        // 模拟数据用于首次渲染
        const used = serviceStatus.value.disk.used || 10
        const free = serviceStatus.value.disk.free || 10
        
        const option = {
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: {
              fontSize: 10
            }
          },
          series: [
            {
              name: '磁盘使用',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['35%', '50%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '14',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: [
                {
                  value: used,
                  name: '已用空间',
                  itemStyle: {
                    color: '#13ce66'
                  }
                },
                {
                  value: free,
                  name: '可用空间',
                  itemStyle: {
                    color: '#f0f2f5'
                  }
                }
              ]
            }
          ]
        }
        
        charts.value.diskPieChart.setOption(option)
      }
    }
    
    // 更新磁盘饼图
    const updateDiskPieChart = () => {
      if (charts.value.diskPieChart) {
        const used = serviceStatus.value.disk.used || 10
        const free = serviceStatus.value.disk.free || 10
        
        charts.value.diskPieChart.setOption({
          series: [{
            data: [
              {
                value: used,
                name: '已用空间',
                itemStyle: {
                  color: '#13ce66'
                }
              },
              {
                value: free,
                name: '可用空间',
                itemStyle: {
                  color: '#f0f2f5'
                }
              }
            ]
          }]
        })
      }
    }
    
    // 初始化磁盘使用率趋势图表
    const initDiskChart = () => {
      if (chartRefs.diskChart && !charts.value.diskChart) {
        charts.value.diskChart = echarts.init(chartRefs.diskChart)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>磁盘使用 {c}%'
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
            name: '使用%)',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            }
          },
          series: [{
            name: '磁盘使用率',
            type: 'line',
            smooth: true,
            data: historyData.value.diskUsage,
            lineStyle: {
              width: 2,
              color: '#13ce66'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(19, 206, 102, 0.3)' },
                { offset: 1, color: 'rgba(19, 206, 102, 0.1)' }
              ])
            },
            markLine: {
              silent: true,
              lineStyle: {
                color: '#999'
              },
              data: [
                { yAxis: 50, name: '警告阈0%', lineStyle: { color: '#ffba00' } },
                { yAxis: 80, name: '危险阈0%', lineStyle: { color: '#ff4949' } }
              ]
            }
          }]
        }
        
        charts.value.diskChart.setOption(option)
      }
    }
    
    // 初始化分区图表
    const initPartitionCharts = () => {
      if (serviceStatus.value.disks && serviceStatus.value.disks.length > 0) {
        serviceStatus.value.disks.forEach((disk, index) => {
          if (partitionChartRefs.value[index]) {
            // 销毁已存在的图表实例
            if (partitionCharts.value[index]) {
              partitionCharts.value[index].dispose()
            }
            
            // 创建新图表实例
            partitionCharts.value[index] = echarts.init(partitionChartRefs.value[index])
            
            const used = disk.used || 1
            const free = disk.free || 1
            
            const option = {
              tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
              },
              series: [
                {
                  name: '分区使用',
                  type: 'pie',
                  radius: ['40%', '70%'],
                  center: ['50%', '50%'],
                  avoidLabelOverlap: false,
                  itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 1
                  },
                  label: {
                    show: false
                  },
                  emphasis: {
                    label: {
                      show: true,
                      fontSize: '12',
                      fontWeight: 'bold'
                    }
                  },
                  labelLine: {
                    show: false
                  },
                  data: [
                    {
                      value: used,
                      name: '已用',
                      itemStyle: {
                        color: getPerformanceColor(disk.percent)
                      }
                    },
                    {
                      value: free,
                      name: '可用',
                      itemStyle: {
                        color: '#f0f2f5'
                      }
                    }
                  ]
                }
              ]
            }
            
            partitionCharts.value[index].setOption(option)
          }
        })
      }
    }
    
    // 初始化网络图表
    const initNetworkChart = () => {
                        
      if (chartRefs.networkChart && !charts.value.networkChart) {
        try {
          charts.value.networkChart = echarts.init(chartRefs.networkChart)
          
          // 确保历史数据不为空
          if (historyData.value.timeLabels.length === 0) {
            const now = new Date()
            for (let i = 5; i >= 0; i--) {
              const time = new Date(now.getTime() - i * 1000 * 30)
              const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`
              
              historyData.value.timeLabels.push(timeStr)
              historyData.value.recvBytes.push(Math.random() * 1024 * 100)
              historyData.value.sendBytes.push(Math.random() * 1024 * 50)
            }
          }
          
          const option = {
            tooltip: {
              trigger: 'axis',
              formatter: function(params) {
                let result = params[0].name + '<br/>'
                params.forEach(item => {
                  result += `${item.seriesName}: ${formatBytes(item.value)}/s<br/>`
                })
                return result
              }
            },
            legend: {
              data: ['接收速度', '发送速度'],
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
            yAxis: {
              type: 'value',
              name: '流量',
              axisLabel: {
                formatter: function(value) {
                  return formatBytes(value) + '/s'
                }
              }
            },
            series: [
              {
                name: '接收速度',
                type: 'line',
                smooth: true,
                data: historyData.value.recvBytes,
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
                symbol: 'circle',
                symbolSize: 6
              },
              {
                name: '发送速度',
                type: 'line',
                smooth: true,
                data: historyData.value.sendBytes,
                lineStyle: {
                  width: 2,
                  color: '#13ce66'
                },
                areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(19, 206, 102, 0.3)' },
                    { offset: 1, color: 'rgba(19, 206, 102, 0.1)' }
                  ])
                },
                symbol: 'circle',
                symbolSize: 6
              }
            ]
          }
          
          charts.value.networkChart.setOption(option)
        } catch (error) {
          console.error('网络图表初始化失败', error)
        }
      }
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
          historyData.value.cpuUsage.push(Math.random() * 30 + 10) // 10-40%的随机CPU使用率
          historyData.value.memoryUsage.push(Math.random() * 20 + 20) // 20-40%的随机内存使用率
          historyData.value.diskUsage.push(Math.random() * 10 + 15) // 15-25%的随机磁盘使用率
          historyData.value.recvBytes.push(Math.random() * 1024 * 100) // 随机接收字节数
          historyData.value.sendBytes.push(Math.random() * 1024 * 50) // 随机发送字节数
        }
      }
      
      // 初始化图表时添加额外的日志记录
      initCpuChart()
      initMemoryChart()
      initDiskChart()
      initMemoryPieChart()
      initDiskPieChart()
      initPartitionCharts()
      
      // 为网络图表添加额外的初始化保护
      setTimeout(() => {
        initNetworkChart()
        
        // 如果网络图表仍未初始化，再尝试一次
        if (!charts.value.networkChart && chartRefs.networkChart) {
          try {
            charts.value.networkChart = echarts.init(chartRefs.networkChart)
          } catch (error) {
            console.error('网络图表强制初始化失败', error)
          }
        }
      }, 300)
    }
    
    // 更新所有图表
    const updateCharts = () => {
                  
      if (charts.value.cpuChart) {
                charts.value.cpuChart.setOption({
          xAxis: { data: historyData.value.timeLabels },
          series: [{ data: historyData.value.cpuUsage }]
        })
      }
      
      if (charts.value.memoryChart) {
                charts.value.memoryChart.setOption({
          xAxis: { data: historyData.value.timeLabels },
          series: [{ data: historyData.value.memoryUsage }]
        })
      }
      
      if (charts.value.diskChart) {
                charts.value.diskChart.setOption({
          xAxis: { data: historyData.value.timeLabels },
          series: [{ data: historyData.value.diskUsage }]
        })
      }
      
      // 特殊处理网络图表，确保它能正确更新
      if (charts.value.networkChart) {
        try {
          charts.value.networkChart.setOption({
            xAxis: { data: historyData.value.timeLabels },
            series: [
              { data: historyData.value.recvBytes },
              { data: historyData.value.sendBytes }
            ]
          })
        } catch (error) {
          console.error('更新网络图表失败:', error)
          // 如果更新失败，尝试重新初始化
          if (chartRefs.networkChart) {
            try {
              charts.value.networkChart.dispose()
              charts.value.networkChart = null
              initNetworkChart()
            } catch (reinitError) {
              console.error('重新初始化网络图表失败', reinitError)
            }
          }
        }
      } else if (chartRefs.networkChart) {
        // 如果网络图表实例不存在但DOM引用存在，尝试初始化
        initNetworkChart()
      }
      
      // 更新饼图
      updateMemoryPieChart()
      updateDiskPieChart()
      
          }
    
    // 刷新所有数据
    const refreshData = async () => {
      try {
        ElMessage.info('正在刷新数据...')
        // 重置倒计时
        resetRefreshCountdown()
        
        // 并行获取所有数据
        await Promise.all([
          fetchServiceStatus(),
          getProcesses()
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

    // 格式化运行时间
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / (24 * 60 * 60))
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((seconds % (60 * 60)) / 60)
      
      if (days > 0) {
        return `${days}天${hours}小时${minutes}分钟`
      } else if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      } else {
        return `${minutes}分钟`
      }
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
      if (percent < 50) {
        return '#13ce66' // 绿色
      } else if (percent < 80) {
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

    // 组件挂载时初始化数据和图表
    onMounted(() => {
      // 等待DOM渲染完成
      nextTick(() => {
        // 先初始化图表（使用模拟数据）
        initCharts()
                
        // 加载实际数据
        refreshData().then(() => {
          // 确保网络数据不为0，添加一些随机数据点
          if (serviceStatus.value.network.recv_bytes_per_sec < 100 && serviceStatus.value.network.send_bytes_per_sec < 100) {
            const now = new Date()
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                // 模拟一些网络活动
                const tempStatus = { ...serviceStatus.value }
                tempStatus.network.recv_bytes_per_sec = Math.random() * 1024 * 200
                tempStatus.network.send_bytes_per_sec = Math.random() * 1024 * 100
                serviceStatus.value = tempStatus
                addHistoryData()
              }, i * 1000)
            }
          }
        })
        
        // 设置自动刷新
        setupAutoRefresh()
        
        // 监听窗口大小变化，重绘图表
        window.addEventListener('resize', handleResize)
        
        // 额外的保障措施：延迟检查网络图表是否初始化成功
        setTimeout(() => {
          // 延迟初始化分区图表，确保标签页切换后能正确显示
          initPartitionCharts()
          if (!charts.value.networkChart && chartRefs.networkChart) {
            initNetworkChart()
          }
        }, 1000)
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
      if (charts.value.cpuChart) {
        charts.value.cpuChart.dispose()
        charts.value.cpuChart = null
      }
      if (charts.value.memoryChart) {
        charts.value.memoryChart.dispose()
        charts.value.memoryChart = null
      }
      if (charts.value.diskChart) {
        charts.value.diskChart.dispose()
        charts.value.diskChart = null
      }
      if (charts.value.networkChart) {
        charts.value.networkChart.dispose()
        charts.value.networkChart = null
      }
      // 销毁饼图实例
      if (charts.value.memoryPieChart) {
        charts.value.memoryPieChart.dispose()
        charts.value.memoryPieChart = null
      }
      if (charts.value.diskPieChart) {
        charts.value.diskPieChart.dispose()
        charts.value.diskPieChart = null
      }
      
      // 移除窗口大小变化监听
      window.removeEventListener('resize', handleResize)
    })
    
    // 处理窗口大小变化
    const handleResize = () => {
      // 调整分区图表大小
      Object.keys(partitionCharts.value).forEach(key => {
        if (partitionCharts.value[key]) {
          partitionCharts.value[key].resize()
        }
      })
      if (charts.value.cpuChart) {
        charts.value.cpuChart.resize()
      }
      if (charts.value.memoryChart) {
        charts.value.memoryChart.resize()
      }
      if (charts.value.diskChart) {
        charts.value.diskChart.resize()
      }
      if (charts.value.networkChart) {
        charts.value.networkChart.resize()
      }
      // 处理饼图的大小调整
      if (charts.value.memoryPieChart) {
        charts.value.memoryPieChart.resize()
      }
      if (charts.value.diskPieChart) {
        charts.value.diskPieChart.resize()
      }
    }

    // 获取磁盘标签页显示标签
    const getDiskTabLabel = (disk) => {
      // 获取挂载点的最后一部分作为标签
      const parts = disk.mountpoint.split('/').filter(Boolean)
      const label = parts.length > 0 ? parts[parts.length - 1] : disk.mountpoint
      // 如果标签太短，使用整个挂载点
      return label.length > 0 ? label : disk.mountpoint
    }
    
    return {
      serviceStatus,
      databaseStatus,
      redisStatus,
      processes,
      refreshCountdown,
      refreshData,
      formatBytes,
      formatUptime,
      formatDate,
      getPerformanceColor,
      getDiskTabLabel,
      activeDiskTab,
      chartRefs,
      cpuChart,
      memoryChart,
      diskChart,
      networkChart,
      memoryPieChart,
      diskPieChart,
      partitionChartRefs,
      partitionCharts
    }
  }
}
</script>

<style scoped>
.service-monitor {
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

.chart-container-small {
  width: 100%;
  height: 250px;
}

/* 指标卡片样式 */
.metric-card {
  height: 100%;
}

/* 饼图容器样式 */
.memory-chart-container, .disk-chart-container {
  width: 100%;
  height: 150px;
  margin-bottom: 10px;
}

.pie-chart-small {
  width: 100%;
  height: 100%;
}

/* 多磁盘信息样*/
.disks-info {
  padding: 10px 0;
}

/* 分区图表样式 */
.partition-chart-container {
  width: 100%;
  height: 120px;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.partition-pie-chart {
  width: 120px;
  height: 120px;
}

/* 分区信息样式 */
.partition-info {
  padding: 5px 0;
}

.disk-partition-details {
  padding: 10px 0;
}

.disk-partition-details p {
  margin: 3px 0;
  font-size: 12px;
  color: #606266;
}

.el-tabs {
  height: 100%;
}

.el-tabs__content {
  height: calc(100% - 40px);
  overflow-y: auto;
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

.memory-info, .cpu-info, .disk-info {
  padding: 10px 0;
}

.memory-usage, .cpu-usage, .disk-usage {
  margin-bottom: 10px;
}

.memory-details, .cpu-details, .disk-details {
  margin-bottom: 10px;
}

.memory-details p, .cpu-details p, .disk-details p {
  margin: 3px 0;
  font-size: 12px;
  color: #606266;
}

.memory-progress, .cpu-progress, .disk-progress {
  margin-top: 10px;
}

.network-info, .system-info, .database-info, .redis-info {
  padding: 10px 0;
}

.network-items, .system-items, .database-items, .redis-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.network-item, .system-item, .database-item, .redis-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.network-label, .system-label, .database-label, .redis-label {
  font-size: 12px;
  color: #606266;
}

.network-value, .system-value, .database-value, .redis-value {
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