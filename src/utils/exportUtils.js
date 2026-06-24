/**
 * 导出工具函数
 * 用于将前端显示的数据导出为CSV或JSON格式
 */

/**
 * 将数据转换为CSV格式
 * @param {Array} data - 要导出的数据数组
 * @param {Array} columns - 列配置，包含label和key
 * @param {Object} formatters - 格式化函数映射
 * @returns {string} CSV字符串
 */
export const convertToCSV = (data, columns, formatters = {}) => {
  // 生成CSV表头
  const headers = columns.map(col => col.label).join(',') + '\n'
  
  // 生成数据行
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key]
      
      // 如果有格式化函数，使用格式化后的值
      if (formatters[col.key]) {
        value = formatters[col.key](row)
      }
      
      // 处理特殊字符：逗号、引号、换行
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""') // 转义引号
        if (value.includes(',') || value.includes('\n')) {
          value = `"${value}"` // 如果包含逗号或换行，用引号包裹
        }
      }
      
      return value
    }).join(',')
  }).join('\n')
  
  return headers + rows
}

/**
 * 下载CSV文件
 * @param {Array} data - 要导出的数据数组
 * @param {Array} columns - 列配置
 * @param {Object} formatters - 格式化函数映射
 * @param {string} filename - 文件名（不含扩展名）
 */
export const exportToCSV = (data, columns, formatters = {}, filename = 'export') => {
  const csv = convertToCSV(data, columns, formatters)
  
  // 创建Blob对象
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  
  // 创建下载链接
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 下载JSON文件
 * @param {Array} data - 要导出的数据数组
 * @param {string} filename - 文件名（不含扩展名）
 */
export const exportToJSON = (data, filename = 'export') => {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 生成HTML表格字符串（用于复制到剪贴板）
 * @param {Array} data - 数据数组
 * @param {Array} columns - 列配置
 * @param {Object} formatters - 格式化函数映射
 * @returns {string} HTML表格字符串
 */
export const convertToHTML = (data, columns, formatters = {}) => {
  const headerRow = columns.map(col => `<th>${col.label}</th>`).join('')
  const bodyRows = data.map(row => {
    const cells = columns.map(col => {
      let value = row[col.key]
      if (formatters[col.key]) {
        value = formatters[col.key](row)
      }
      return `<td>${value}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('')
  
  return `<table border="1"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`
}