<template>
  <div class="log-container">
    <h1>操作日志</h1>
    <!-- 搜索条件区域 -->
    <el-card class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作人">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" class="search-input" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.action" placeholder="请选择操作类型" class="search-select" clearable>
            <el-option label="登录" value="Login" />
            <el-option label="登出" value="Logout" />
            <el-option label="创建" value="Create" />
            <el-option label="更新" value="Update" />
            <el-option label="删除" value="Delete" />
            <el-option label="查询" value="Query" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块">
          <el-input v-model="searchForm.module" placeholder="请输入操作模块" class="search-input" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="search-date-range"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-table border :data="operationLogs" style="width: 100%" v-loading="loading">
      <el-table-column type="index" label="序号" />
      <el-table-column prop="user" label="操作人" />
      <el-table-column prop="module" label="操作模块" />
      <el-table-column prop="operation" label="操作内容" />
      <el-table-column prop="action" label="操作类型" width="120">
        <template #default="scope">
          <el-tag 
            v-if="scope.row.action === 'Login'" 
            type="success"
            class="action-tag"
          >登录</el-tag>
          <el-tag 
            v-else-if="scope.row.action === 'Logout'" 
            type="info"
            class="action-tag"
          >登出</el-tag>
          <el-tag 
            v-else-if="scope.row.action === 'Create'" 
            type="primary"
            class="action-tag"
          >创建</el-tag>
          <el-tag 
            v-else-if="scope.row.action === 'Update'" 
            type="warning"
            class="action-tag"
          >更新</el-tag>
          <el-tag 
            v-else-if="scope.row.action === 'Delete'" 
            type="danger"
            class="action-tag"
          >删除</el-tag>
          <el-tag 
            v-else-if="scope.row.action === 'Query'" 
            type="info"
            class="action-tag"
          >查询</el-tag>
          <span v-else>{{ scope.row.action }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ip_address" label="IP 地址" />
      <el-table-column prop="created_at" label="操作时间" :formatter="formatDate" />
      <el-table-column prop="details" label="操作详情" />
      <el-table-column label="操作" min-width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetails(row)" type="primary">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 操作日志详情对话-->
    <el-dialog
      v-model="dialogVisible"
      title="操作日志详情"
      width="60%"
      :before-close="handleClose"
      :close-on-click-modal="false"
    >
      <div v-if="currentLog" style="line-height: 2; font-size: 14px;">
        <div class="el-row">
          <div class="el-col el-col-24">
            <strong style="display: inline-block; width: 100px;">操作日志ID:</strong>
            <span>{{ currentLog.id }}</span>
          </div>
        </div>
        <div class="el-row">
          <div class="el-col el-col-12">
            <strong style="display: inline-block; width: 100px;">操作</strong>
            <span>{{ currentLog.user || '-' }}</span>
          </div>
          <div class="el-col el-col-12">
            <strong style="display: inline-block; width: 100px;">操作时间:</strong>
            <span>{{ formatDate(currentLog, null, currentLog.created_at) }}</span>
          </div>
        </div>
        <div class="el-row">
            <div class="el-col el-col-12">
              <strong style="display: inline-block; width: 100px;">操作模块:</strong>
              <span>{{ currentLog.module || '-' }}</span>
            </div>
            <div class="el-col el-col-12">
              <strong style="display: inline-block; width: 100px;">操作类型:</strong>
              <span>{{ currentLog.operation || '-' }}</span>
            </div>
          </div>
          <div class="el-row">
            <div class="el-col el-col-12">
              <strong style="display: inline-block; width: 100px;">IP地址:</strong>
              <span>{{ currentLog.ip_address || '-' }}</span>
            </div>
          </div>
        <div class="el-row">
          <div class="el-col el-col-12">
            <strong style="display: inline-block; width: 100px;">操作模型:</strong>
            <span>{{ currentLog.model || '-' }}</span>
          </div>
          <div class="el-col el-col-12">
            <strong style="display: inline-block; width: 100px;">模型ID:</strong>
            <span>{{ currentLog.model_id || '-' }}</span>
          </div>
        </div>
        <div class="el-row" style="margin-top: 10px;">
          <div class="el-col el-col-24">
            <strong style="display: inline-block; width: 100px; vertical-align: top;">操作详情:</strong>
            <pre style="display: inline; white-space: pre-wrap; word-break: break-word; margin: 0;">{{ currentLog.details || '-' }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
  
<script>
import { getOperationLogList } from '../api/operationLog'
import '../assets/common/search-styles.css'

export default {
  name: 'OperationLog',
  data() {
    return {
      loading: false,
      activeMenu: '/operationlog',
      operationLogs: [], // 操作日志数据
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      searchParams: {}, // 实际发送给API的搜索参数
      searchForm: {
        username: '',
        action: '',
        module: '',
        dateRange: []
      }, // 用户界面的搜索表单数据
      dialogVisible: false, // 控制详情对话框显示
      currentLog: null // 当前选中的日志详情
    }
  },
  methods: {
    // 构建搜索参数并执行搜索
    handleSearch() {
      // 重置到第一页
      this.pagination.currentPage = 1
      // 构建搜索参数
      this.buildSearchParams()
      // 执行搜索
      this.fetchData()
    },
    
    // 重置搜索表单
    handleReset() {
      this.searchForm = {
        username: '',
        action: '',
        module: '',
        dateRange: []
      }
      this.searchParams = {}
      this.pagination.currentPage = 1
      this.fetchData()
    },
    
    // 根据表单构建API调用的搜索参数
    buildSearchParams() {
      this.searchParams = {}
      
      // 添加操作类型搜索
      if (this.searchForm.action) {
        this.searchParams.action = this.searchForm.action
      }
      
      // 添加操作模块搜索，后端OperationLogFilter中使用model参数
      if (this.searchForm.module) {
        this.searchParams.model = this.searchForm.module
      }
      
      // 添加日期范围搜索，后端使用created_at__gte和created_at__lte
      if (this.searchForm.dateRange && this.searchForm.dateRange.length === 2) {
        // 格式化为ISO字符串
        this.searchParams.created_at__gte = this.formatDateForApi(this.searchForm.dateRange[0])
        this.searchParams.created_at__lte = this.formatDateForApi(this.searchForm.dateRange[1], true)
      }
      
      // 注意：后端OperationLogFilter不支持按username过滤，只支持user_id
      // 用户名过滤将在前端获取数据后进行
    },
    
    // 格式化日期为API所需的格式
    formatDateForApi(date, isEndOfDay = false) {
      const d = new Date(date)
      if (isEndOfDay) {
        d.setHours(23, 59, 59, 999)
      } else {
        d.setHours(0, 0, 0, 0)
      }
      return d.toISOString()
    },
    
    async fetchData() {
      this.loading = true
      try {
        // 构建请求参数，包含分页信息
        const params = {
          page: this.pagination.currentPage,
          page_size: this.pagination.pageSize,
          ...this.searchParams
        }
        
        // 调用真实API获取数据
        const response = await getOperationLogList(params)
        
        // 处理响应数据
        // 接口文档规范：getOperationLogList接口返回值直接使用，响应结构已经在API层处理
        let results = response.results || []
        
        // 如果有用户名搜索条件，在前端进行过滤
        if (this.searchForm.username) {
          const usernameLower = this.searchForm.username.toLowerCase()
          results = results.filter(log => 
            log.user && log.user.toLowerCase().includes(usernameLower)
          )
        }
        
        this.operationLogs = results
        this.pagination.total = response.count || 0
        
        // 注意：当有前端过滤时，显示的总数仍然是API返回的总数，而不是过滤后的数量
        // 如果需要完全准确的分页，需要让后端支持按用户名过滤
      } catch (error) {
        console.error('获取操作日志失败:', error)
        // 显示错误提示
        this.$message.error('获取操作日志失败，请重试')
        // 清空数据列表，避免显示旧数据
        this.operationLogs = []
        this.pagination.total = 0
      } finally {
        this.loading = false
      }
    },
    
    // 当页面大小改变时触发
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.fetchData()
    },
    
    // 当当前页码改变时触发
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.fetchData()
    },
    
    // 格式化日期
    formatDate(row, column, cellValue) {
      if (!cellValue) return ''
      const date = new Date(cellValue)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    
    // 查看详情
    viewDetails(row) {
      this.currentLog = row
      this.dialogVisible = true
    },
      
    // 获取操作类型对应的颜色
    getActionTypeColor(action) {
      if (!action) return 'default'
      const actionLower = action.toLowerCase()
        
      // 根据不同的操作类型返回不同的标签颜色
      if (actionLower.includes('create') || actionLower.includes('新增') || actionLower.includes('add')) {
        return 'success'
      } else if (actionLower.includes('update') || actionLower.includes('编辑') || actionLower.includes('modify')) {
        return 'warning'
      } else if (actionLower.includes('delete') || actionLower.includes('删除')) {
        return 'danger'
      } else if (actionLower.includes('login') || actionLower.includes('登录')) {
        return 'primary'
      } else if (actionLower.includes('logout') || actionLower.includes('退出')) {
        return 'info'
      } else {
        return 'default'
      }
    },
      
    // 关闭对话框
    handleClose() {
      this.dialogVisible = false
      this.currentLog = null
    }
  },
  mounted() {
    this.fetchData()
  },
}
</script>
  
  <style scoped>
.el-menu {
  margin-bottom: 20px;
}

.log-container {
  width: 100%;
  overflow-x: auto;
  padding: 20px;
}

/* 本地特定样式，公共样式已在search-styles.css中定*/

/* 确保表格在侧边栏折叠时可以自适应宽度 */
/* :deep(.el-table) {
  width: 100% !important;
  max-width: 100%;
} */

/* 分页区域样式 */
:deep(.el-pagination) {
  margin-top: 20px;
}
</style>


  