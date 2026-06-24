<template>
  <div ref="chart" :style="{ width: width, height: height }"></div>
</template>

<script>
import * as echarts from 'echarts'

// 定义常用的图表主题和配置模板
const CHART_TEMPLATES = {
  line: {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: []
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: []
  },
  bar: {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: []
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: []
  },
  pie: {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '',
      type: 'pie',
      radius: '50%',
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  },
  radar: {
    tooltip: {},
    legend: {
      data: []
    },
    radar: {
      indicator: []
    },
    series: [{
      name: '',
      type: 'radar',
      data: []
    }]
  }
}

export default {
  name: 'Chart',
  props: {
    // 图表数据
    chartData: {
      type: Object,
      required: true
    },
    // 图表类型
    chartType: {
      type: String,
      default: 'line'
    },
    // 图表宽度
    width: {
      type: String,
      default: '100%'
    },
    // 图表高度
    height: {
      type: String,
      default: '300px'
    },
    // 是否响应窗口大小变化
    responsive: {
      type: Boolean,
      default: true
    },
    // 主题颜色数组
    colors: {
      type: Array,
      default: () => ['#409EFF', '#67C23A', '#F56C6C', '#E6A23C', '#909399', '#C0C4CC']
    }
  },
  data() {
    return {
      chartInstance: null,
      resizeTimer: null
    }
  },
  mounted() {
    // 使用 requestAnimationFrame 确保 DOM 完全渲染后再初始化图表
    this.safeInitChart()
    if (this.responsive) {
      window.addEventListener('resize', this.handleResize)
    }
  },
  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.dispose()
    }
    if (this.responsive) {
      window.removeEventListener('resize', this.handleResize)
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer)
      }
    }
  },
  methods: {
    // 验证图表数据结构
    validateChartData(data) {
      if (!data || typeof data !== 'object') {
        console.error('Chart data is not an object:', data)
        return false
      }
      if (!Array.isArray(data.series)) {
        console.error('Chart data.series is not an array:', data.series)
        return false
      }
      for (let i = 0; i < data.series.length; i++) {
        if (!data.series[i] || typeof data.series[i] !== 'object') {
          console.error(`Chart data.series[${i}] is invalid:`, data.series[i])
          return false
        }
        if (!data.series[i].type) {
          console.error(`Chart data.series[${i}].type is missing:`, data.series[i])
          return false
        }
      }
      return true
    },
    
    // 初始化图表
    initChart() {
      // 检查 DOM 是否存在
      const chartDom = this.$refs.chart
      if (!chartDom) {
        console.error('Chart DOM element not found')
        return false
      }
      
      // 检查 DOM 是否有实际尺寸
      if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        console.warn('Chart container has zero size, delaying initialization')
        return false
      }
      
      // 验证数据
      console.log('Chart init data:', JSON.stringify(this.chartData))
      if (!this.validateChartData(this.chartData)) {
        console.error('Invalid chart data, skipping initialization')
        return false
      }
      
      this.chartInstance = echarts.init(chartDom)
      
      // 应用主题颜色
      if (this.colors && this.colors.length > 0) {
        this.chartData.color = this.chartData.color || this.colors
      }
      
      try {
        this.chartInstance.setOption(this.chartData)
      } catch (err) {
        console.error('ECharts setOption error:', err)
        console.error('Chart data:', JSON.stringify(this.chartData))
      }
      return true
    },
    
    // 安全初始化图表，带有重试机制
    safeInitChart(retries = 5) {
      const chartDom = this.$refs.chart
      
      if (!chartDom) {
        if (retries > 0) {
          console.warn(`Chart DOM not found, retrying... (${retries} attempts left)`)
          requestAnimationFrame(() => {
            this.safeInitChart(retries - 1)
          })
        } else {
          console.error('Chart DOM element not found after multiple retries')
        }
        return
      }
      
      // 如果 DOM 存在但尺寸为 0，继续等待
      if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        if (retries > 0) {
          console.warn(`Chart container has zero size, retrying... (${retries} attempts left)`)
          setTimeout(() => {
            this.safeInitChart(retries - 1)
          }, 100)
        } else {
          console.error('Chart container has zero size after multiple retries')
        }
        return
      }
      
      // 初始化图表
      this.initChart()
    },
    
    // 窗口大小变化处理（防抖）
    handleResize() {
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer)
      }
      this.resizeTimer = setTimeout(() => {
        if (this.chartInstance) {
          this.chartInstance.resize()
        }
      }, 100)
    },
    
    // 更新图表数据
    updateChart(newData) {
      if (this.chartInstance && newData) {
        // 验证数据
        if (!this.validateChartData(newData)) {
          console.error('Invalid chart data in updateChart, skipping update')
          return
        }
        
        // 应用主题颜色
        if (this.colors && this.colors.length > 0) {
          newData.color = newData.color || this.colors
        }
        
        try {
          this.chartInstance.setOption(newData)
        } catch (err) {
          console.error('ECharts setOption error in updateChart:', err)
          console.error('Chart data:', JSON.stringify(newData))
        }
      }
    },
    
    // 获取图表模板配置
    getChartTemplate(type) {
      return { ...CHART_TEMPLATES[type] || CHART_TEMPLATES.line }
    },
    
    // 导出图表为图片
    exportChart(fileName = 'chart', type = 'png') {
      if (this.chartInstance) {
        const url = this.chartInstance.getDataURL({
          type: type,
          pixelRatio: 2,
          backgroundColor: '#fff'
        })
        
        const link = document.createElement('a')
        link.download = `${fileName}.${type}`
        link.href = url
        link.click()
      }
    }
  },
  
  // 监听数据变化
  watch: {
    chartData: {
      handler(newVal) {
        if (this.chartInstance && newVal) {
          this.updateChart(newVal)
        }
      },
      deep: true
    },
    
    colors: {
      handler(newVal) {
        if (this.chartInstance && newVal && newVal.length > 0) {
          const option = this.chartInstance.getOption()
          option.color = newVal
          this.chartInstance.setOption(option)
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
}
</style>
  