<template>
  <div class="import-export-container">
    <el-button 
      :loading="loading || importLoading" 
      @click="handleImport"
      :style="buttonStyle"
      :type="buttonType"
      :size="size"
      :icon="importIcon"
      style="margin-right: 10px;">
      {{ importText }}
    </el-button>
    <el-dropdown 
      @command="handleExport"
      :disabled="loading || exportLoading" 
      :style="buttonStyle">
      <el-button 
        :loading="loading || exportLoading"
        :type="buttonType"
        :size="size"
        :icon="exportIcon">
        {{ exportText }}
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="excel">导出Excel</el-dropdown-item>
          <el-dropdown-item command="csv">导出CSV</el-dropdown-item>
          <el-dropdown-item divided command="template">下载导入模板</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'
import { apiGet, apiPost } from '../utils/api/apiRequestWrapper'

export default {
  name: 'ImportExport',
  components: {
    ArrowDown,
    ElIcon
  },
  props: {
    // API前缀，用于构建导入导出的API路径
    apiPrefix: {
      type: String,
      required: true
    },
    // 支持的文件类型
    fileTypes: {
      type: Array,
      default: () => ['xlsx', 'xls', 'csv']
    },
    // 导入成功回调
    onImportSuccess: {
      type: Function,
      default: null
    },
    // 导入失败回调
    onImportError: {
      type: Function,
      default: null
    },
    // 外部控制的加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 导出时携带的参数
    exportParams: {
      type: Object,
      default: () => ({})
    },
    // 按钮样式
    buttonStyle: {
      type: Object,
      default: () => ({})
    },
    // 按钮类型
    buttonType: {
      type: String,
      default: ''
    },
    // 按钮大小
    size: {
      type: String,
      default: 'default'
    },
    // 导入按钮文本
    importText: {
      type: String,
      default: '导入'
    },
    // 导出按钮文本
    exportText: {
      type: String,
      default: '导出数据'
    },
    // 导入图标
    importIcon: {
      type: Object,
      default: null
    },
    // 导出图标
    exportIcon: {
      type: Object,
      default: null
    },
    // 模板下载文件名，外部传入，灵活配置
    templateFilename: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      importLoading: false,
      exportLoading: false
    }
  },
  methods: {
    // 处理导入
    async handleImport() {
      try {
        // 创建文件输入元素
        const uploadInput = document.createElement('input')
        uploadInput.type = 'file'
        uploadInput.accept = this.fileTypes.map(type => `.${type}`).join(',')
        uploadInput.style.display = 'none'
        document.body.appendChild(uploadInput)
        
        uploadInput.onchange = async (event) => {
          const file = event.target.files[0]
          if (file) {
            await this.handleFileUpload(file)
          }
          document.body.removeChild(uploadInput)
        }
        
        uploadInput.click()
      } catch (error) {
        console.error('导入操作失败:', error)
        ElMessage.error('导入操作失败')
        this.$emit('import-error', error)
        if (this.onImportError) {
          this.onImportError(error)
        }
      }
    },

    // 处理文件上传
    async handleFileUpload(file) {
      try {
        // 文件类型校验
        const fileType = file.name.split('.').pop().toLowerCase()
        if (!this.fileTypes.includes(fileType)) {
          ElMessage.error(`只支{this.fileTypes.join(')}文件格式！`)
          return
        }

        this.importLoading = true
        
        // 创建FormData
        const formData = new FormData()
        formData.append('file', file)
        
        // 根据文件类型选择不同的导入API
        const apiPath = fileType === 'csv' ?
           `${this.apiPrefix}/import-csv/` :
          `${this.apiPrefix}/import-excel/`
        
        // 发送请求
        const response = await apiPost(apiPath, formData, '导入数据', true, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        ElMessage.success('导入成功')
        this.$emit('import-success', response.data, file)
        
        if (this.onImportSuccess) {
          this.onImportSuccess(response.data, file)
        }
      } catch (error) {
        console.error('文件上传失败:', error)
        ElMessage.error('导入失败')
        this.$emit('import-error', error, file)
        
        if (this.onImportError) {
          this.onImportError(error, file)
        }
      } finally {
        this.importLoading = false
      }
    },

    // 处理导出
    async handleExport(command) {
      try {
        this.exportLoading = true
        
        let apiPath
        let fileExt
        let defaultFilename
        let mimeType
        let operationText
        
        // 根据命令类型选择不同的API路径和参数
        let requestParams = { ...this.exportParams }
        if (command === 'template') {
          // 模板下载
          apiPath = `${this.apiPrefix}/template-download/`
          fileExt = 'xlsx'
          // 使用外部传入的模板文件名，如果没有则使用默认值
          defaultFilename = this.templateFilename || '导入模板.xlsx'
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          operationText = '下载模板'
          
          // 如果提供了模板文件名，将其添加到请求参数中
          if (this.templateFilename) {
            requestParams = { ...requestParams, filename: this.templateFilename }
          }
        } else {
          // 数据导出
          apiPath = command === 'excel' ?
             `${this.apiPrefix}/export-excel/` :
            `${this.apiPrefix}/export-csv/`
          fileExt = command === 'excel' ? 'xlsx' : 'csv'
          defaultFilename = `数据列表.${fileExt}`
          mimeType = command === 'excel' ?
             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            'text/csv; charset=utf-8'
          operationText = `导出${command.toUpperCase()}`
        }
        
        // 发送请求，设置响应类型为blob
        const response = await apiGet(apiPath, requestParams, operationText, true, {
          responseType: 'blob'
        })
        
        // 从响应头中获取文件名
        const contentDisposition = response.headers['content-disposition']
        let filename = defaultFilename
        if (contentDisposition) {
          const match = contentDisposition.match(/filename=([^;]+)/i)
          if (match && match[1]) {
            filename = decodeURIComponent(match[1].replace(/"/g, ''))
          }
        }
        
        // 创建下载链接
        const blob = new Blob([response.data], { type: mimeType })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        
        // 清理
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(`${operationText}成功`)
        this.$emit('export-success', { success: true, filename, type: command })
      } catch (error) {
        console.error(`${command === 'template' ? '下载模板' : `导出${command.toUpperCase()}`}失败:`, error)
        ElMessage.error(`${command === 'template' ? '下载模板' : `导出${command.toUpperCase()}`}失败`)
        this.$emit('export-error', error, command)
      } finally {
        this.exportLoading = false
      }
    }
  }
}
</script>

<style scoped>
.import-export-container {
  display: inline-flex;
  align-items: center;
}
</style>