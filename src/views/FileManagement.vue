<template>
  <div class="file-management">
    <div class="page-header">
      <h1>文件管理</h1>
      <div class="header-actions">
        <el-dropdown trigger="click">
          <el-button type="primary">
            导出数据 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-item @click="exportToCSV">导出CSV</el-dropdown-item>
            <el-dropdown-item @click="exportToJSON">导出JSON</el-dropdown-item>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 搜索表单 -->
    <el-card class="search-container">
      <el-form :inline="true" :model="searchParams" ref="searchForm">
        <el-form-item label="文件名">
          <el-input v-model="searchParams.name" placeholder="请输入文件名" style="width: 200px;"/>
        </el-form-item>
        <el-form-item label="文件类型">
          <el-select v-model="searchParams.file_type" placeholder="请选择文件类型" style="width: 150px;">
            <el-option label="全部" value="" />
            <el-option label="文档" value="doc" />
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="音频" value="audio" />
            <el-option label="压缩" value="archive" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 文件列表表格 -->
    <el-table 
      border 
      :data="fileList" 
      v-loading="loading"
      style="width: 100%"
      max-height="600">
      <el-table-column type="index" label="序号" width="80"/>
      <el-table-column prop="name" label="文件名" min-width="200"/>
      <el-table-column prop="file_type" label="文件类型" width="120">
        <template #default="{ row }">
          <span>{{ getFileTypeLabel(row.file_type, row.category_name) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="size" label="文件大小" width="120">
        <template #default="{ row }">
          <span>{{ formatFileSize(row.size) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="permission" label="权限" width="100">
        <template #default="{ row }">
          <el-tag :type="getPermissionType(row.permission)">{{ getPermissionLabel(row.permission) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="uploader_name" label="上传者" width="120"/>
      <el-table-column prop="created_at" label="上传时间" width="180"/>
      <el-table-column label="操作" min-width="180" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button size="small" @click="downloadFile(row.id)" type="primary">下载</el-button>
            <el-button size="small" @click="viewDetail(row)">查看</el-button>
            
            <!-- 下拉菜单 -->
            <el-dropdown trigger="click">
              <el-button size="small">
                更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editFile(row)">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="deleteFile(row.id)">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="margin-top: 20px; display: flex; justify-content: flex-end;"
    />
    
    <!-- 文件详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="文件详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="文件名">{{ selectedFile.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="文件类型">{{ getFileTypeLabel(selectedFile.file_type, selectedFile.category_name) }}</el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(selectedFile.size) }}</el-descriptions-item>
        <el-descriptions-item label="权限">{{ getPermissionLabel(selectedFile.permission) }}</el-descriptions-item>
        <el-descriptions-item label="上传者">{{ selectedFile.uploader_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上传时间">{{ selectedFile.created_at }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ selectedFile.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    
    <!-- 编辑文件弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑文件信息" width="500px">
      <el-form :model="editForm" ref="editFormRef" label-width="100px">
        <el-form-item label="文件名" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入文件名"/>
        </el-form-item>
        <el-form-item label="文件描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" placeholder="请输入文件描述" :rows="3"/>
        </el-form-item>
        <el-form-item label="权限" prop="permission">
          <el-select v-model="editForm.permission" style="width: 100%;">
            <el-option :value="0" label="私有" />
            <el-option :value="1" label="部门可见" />
            <el-option :value="2" label="公开" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { getFileList, downloadFile, deleteFile, getFileDetail, updateFileInfo } from '../api/file'
import { exportToCSV, exportToJSON } from '../utils/exportUtils'

export default {
  name: 'FileManagement',
  setup() {
    const fileList = ref([])
    const loading = ref(false)
    const detailDialogVisible = ref(false)
    const editDialogVisible = ref(false)
    const selectedFile = reactive({})
    const editForm = reactive({
      id: '',
      name: '',
      description: '',
      permission: 0
    })
    
    const searchParams = reactive({
      name: '',
      file_type: ''
    })
    
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 文件类型映射 - 新格式（分类）
    const fileTypeMap = {
      'doc': '文档',
      'image': '图片',
      'video': '视频',
      'audio': '音频',
      'archive': '压缩',
      'other': '其他'
    }
    
    // 文件扩展名到分类的映射 - 兼容旧格式
    const extToCategoryMap = {
      // 文档
      'doc': 'doc',
      'docx': 'doc',
      'txt': 'doc',
      'pdf': 'doc',
      'xls': 'doc',
      'xlsx': 'doc',
      'ppt': 'doc',
      'pptx': 'doc',
      'csv': 'doc',
      'md': 'doc',
      'json': 'doc',
      'xml': 'doc',
      // 图片
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      'webp': 'image',
      'svg': 'image',
      // 视频
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video',
      'wmv': 'video',
      'flv': 'video',
      'mkv': 'video',
      // 音频
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'flac': 'audio',
      'm4a': 'audio',
      // 压缩
      'zip': 'archive',
      'rar': 'archive',
      '7z': 'archive',
      'tar': 'archive',
      'gz': 'archive',
    }
    
    // 权限映射
    const permissionMap = {
      0: { label: '私有', type: 'warning' },
      1: { label: '部门可见', type: 'primary' },
      2: { label: '公开', type: 'success' }
    }
    
    const getFileTypeLabel = (fileType, categoryName) => {
      // 优先使用后端返回的category_name字段
      if (categoryName) {
        return categoryName
      }
      
      if (!fileType) return '未知'
      
      // 首先尝试直接从分类映射查找（新格式）
      if (fileTypeMap[fileType]) {
        return fileTypeMap[fileType]
      }
      
      // 如果不是分类，尝试作为扩展名查找对应的分类（兼容旧格式）
      let ext = fileType.toLowerCase()
      // 移除开头的点号
      if (ext.startsWith('.')) {
        ext = ext.slice(1)
      }
      const category = extToCategoryMap[ext]
      if (category && fileTypeMap[category]) {
        return fileTypeMap[category]
      }
      
      return '未知'
    }
    
    const getPermissionLabel = (permission) => {
      return permissionMap[permission]?.label || '未知'
    }
    
    const getPermissionType = (permission) => {
      return permissionMap[permission]?.type || 'default'
    }
    
    const formatFileSize = (size) => {
      if (!size) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB']
      let index = 0
      let fileSize = size
      while (fileSize >= 1024 && index < units.length - 1) {
        fileSize /= 1024
        index++
      }
      return `${fileSize.toFixed(2)} ${units[index]}`
    }
    
    // 加载文件列表
    const loadFileList = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          page_size: pagination.pageSize,
          ...searchParams
        }
        const response = await getFileList(params)
        fileList.value = response.results || []
        pagination.total = response.count || 0
      } catch (error) {
        console.error('获取文件列表失败:', error)
        fileList.value = []
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadFileList()
    }
    
    // 重置
    const handleReset = () => {
      searchParams.name = ''
      searchParams.file_type = ''
      pagination.currentPage = 1
      loadFileList()
    }
    
    // 分页大小改变
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadFileList()
    }
    
    // 当前页改变
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadFileList()
    }
    
    // 下载文件
    const downloadFileHandler = async (fileId) => {
      try {
        await downloadFile(fileId)
      } catch (error) {
        console.error('下载文件失败:', error)
      }
    }
    
    // 查看详情
    const viewDetail = async (row) => {
      try {
        const detail = await getFileDetail(row.id)
        Object.assign(selectedFile, detail)
        detailDialogVisible.value = true
      } catch (error) {
        console.error('获取文件详情失败:', error)
      }
    }
    
    // 编辑文件
    const editFile = (row) => {
      if (!row || !row.id) {
        console.error('无效的文件数据')
        return
      }
      editForm.id = row.id
      editForm.name = row.name || ''
      editForm.description = row.description || ''
      editForm.permission = row.permission !== undefined ? row.permission : 0
      editDialogVisible.value = true
    }
    
    // 提交编辑
    const submitEdit = async () => {
      try {
        await updateFileInfo(editForm.id, {
          name: editForm.name,
          description: editForm.description,
          permission: editForm.permission
        })
        editDialogVisible.value = false
        loadFileList()
      } catch (error) {
        console.error('更新文件信息失败:', error)
      } finally {
        // 无论成功还是失败都关闭弹窗
        editDialogVisible.value = false
      }
    }
    
    // 删除文件
    const deleteFileHandler = async (fileId) => {
      try {
        await deleteFile(fileId)
        loadFileList()
      } catch (error) {
        console.error('删除文件失败:', error)
      }
    }
    
    // 导出CSV
    const exportToCSV = () => {
      const columns = [
        { label: '文件名', key: 'name' },
        { label: '文件类型', key: 'file_type' },
        { label: '文件大小', key: 'size' },
        { label: '权限', key: 'permission' },
        { label: '上传者', key: 'uploader_name' },
        { label: '上传时间', key: 'created_at' }
      ]
      
      const formatters = {
        'file_type': (row) => getFileTypeLabel(row.file_type, row.category_name),
        'size': (row) => formatFileSize(row.size),
        'permission': (row) => getPermissionLabel(row.permission)
      }
      
      exportToCSV(fileList.value, columns, formatters, '文件列表')
    }
    
    // 导出JSON
    const exportToJSON = () => {
      // 先格式化数据
      const formattedData = fileList.value.map(row => ({
        '文件名': row.name,
        '文件类型': getFileTypeLabel(row.file_type, row.category_name),
        '文件大小': formatFileSize(row.size),
        '权限': getPermissionLabel(row.permission),
        '上传者': row.uploader_name,
        '上传时间': row.created_at,
        '描述': row.description || ''
      }))
      
      exportToJSON(formattedData, '文件列表')
    }
    
    // 组件挂载时加载数据
    loadFileList()
    
    return {
      fileList,
      loading,
      searchParams,
      pagination,
      detailDialogVisible,
      editDialogVisible,
      selectedFile,
      editForm,
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      downloadFile: downloadFileHandler,
      viewDetail,
      editFile,
      submitEdit,
      deleteFile: deleteFileHandler,
      exportToCSV,
      exportToJSON,
      getFileTypeLabel,
      getPermissionLabel,
      getPermissionType,
      formatFileSize
    }
  }
}
</script>

<style scoped>
.file-management {
  padding: 20px;
}
.search-container {
  margin-bottom: 20px;
}
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>