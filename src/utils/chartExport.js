/**
 * 图表导出工具函数
 * 封装通用的图表导出逻辑
 */

import { ElMessage } from 'element-plus'

/**
 * 导出图表
 * @param {Object} refs - 组件的 $refs 对象
 * @param {string} refName - 图表组件的引用名称
 * @param {string} fileName - 导出文件名
 */
export function exportChart(refs, refName, fileName) {
  if (!refName || !fileName) {
    ElMessage.warning('导出参数不完整')
    return
  }
  
  if (!refs) {
    ElMessage.error('图表引用不可用')
    return
  }
  
  const chartComponent = refs[refName]
  if (chartComponent && typeof chartComponent.exportChart === 'function') {
    try {
      chartComponent.exportChart(fileName)
      ElMessage.success(`图表已导出 ${fileName}.png`)
    } catch (error) {
      console.error('Chart export error:', error)
      ElMessage.error('图表导出失败')
    }
  } else {
    ElMessage.warning('找不到指定图表或导出功能不可用')
  }
}

/**
 * 批量导出多个图表
 * @param {Object} refs - 组件的 $refs 对象
 * @param {Array} charts - 图表配置数组，格式: [{ refName, fileName }]
 */
export function exportCharts(refs, charts) {
  if (!charts || !Array.isArray(charts)) {
    ElMessage.warning('图表配置无效')
    return
  }
  
  charts.forEach(({ refName, fileName }) => {
    exportChart(refs, refName, fileName)
    // 添加延迟避免同时导出导致问题
    setTimeout(() => {}, 500)
  })
}