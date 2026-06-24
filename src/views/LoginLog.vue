<template>
  <div class="log-container">
    <h1>登录日志</h1>
    
    <!-- 搜索表单 -->
    <el-card class="search-container">
      <el-form :inline="true" :model="searchParams" ref="searchForm">
        <el-form-item label="用户名">
          <el-input v-model="searchParams.username" placeholder="请输入用户名" style="width: 180px;"/>
        </el-form-item>
        <el-form-item label="登录IP">
          <el-input v-model="searchParams.loginIp" placeholder="请输入IP地址" style="width: 180px;"/>
        </el-form-item>
        <el-form-item label="登录时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 表格 -->
    <el-table border 
      :data="loginLogs" 
      v-loading="loading"
      style="width: 100%"
      max-height="700">
      <el-table-column type="index" label="序号" width="80"/>
      <el-table-column prop="username" label="登录用户" width="150"/>
      <el-table-column prop="ip" label="登录IP" width="150"/>
      <el-table-column prop="country" label="国家" width="120"/>
      <el-table-column prop="province" label="省份" width="120"/>
      <el-table-column prop="city" label="城市" width="120"/>
      <el-table-column prop="os" label="操作系统" width="150"/>
      <el-table-column prop="browser" label="浏览器名" width="120"/>
      <el-table-column prop="created_at" label="登录时间" width="180"/>
      <el-table-column label="操作" min-width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetails(row)" type="primary">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 登录详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="登录详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户">{{ selectedLog.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录IP">{{ selectedLog.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录时间">{{ selectedLog.created_at}}</el-descriptions-item>
        <el-descriptions-item label="登录地点">{{ selectedLog.country || '' }} {{ selectedLog.province || '' }} {{ selectedLog.city || '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录类型">{{ selectedLog.login_type_display || selectedLog.login_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ selectedLog.os || '-' }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ selectedLog.browser || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户代理">
          <div style="word-break: break-all;">{{ selectedLog.agent || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    
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
  </div>
</template>

<script>
import { getLoginLogList, getLoginLogDetail } from '../api/loginLog'

export default {
  data() {
    return {
      loginLogs: [],
      selectedLog: {},
      loading: false,
      detailDialogVisible: false,
      searchParams: {
        username: '',
        loginIp: '',
        startTime: '',
        endTime: ''
      },
      dateRange: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  mounted() {
    this.loadLoginLogs()
  },
  methods: {
    // 格式化日期为ISO字符串，适用于API请求
    formatDateForApi(date, isEndDate = false) {
      if (!date) return ''
      const d = new Date(date)
      // 处理开始日期：设置为当天的00:00:00
      if (!isEndDate) {
        d.setHours(0, 0, 0, 0)
      } else {
        // 处理结束日期：设置为当天3:59:59
        d.setHours(23, 59, 59, 999)
      }
      return d.toISOString()
    },

    // 加载登录日志列表
    async loadLoginLogs() {
      this.loading = true
      // 构建与后端匹配的参数
      const params = {
        page: this.pagination.currentPage,
        page_size: this.pagination.pageSize,
        username: this.searchParams.username,
        // 将loginIp映射为ip，与后端过滤字段匹配
        ip: this.searchParams.loginIp
      }

      // 添加日期范围过滤，如果有值的话
      if (this.searchParams.startTime) {
        params.start_date = this.formatDateForApi(this.searchParams.startTime)
      }
      if (this.searchParams.endTime) {
        params.end_date = this.formatDateForApi(this.searchParams.endTime, true)
      }
      
      try {
        const response = await getLoginLogList(params)
                // 正确处理Django REST Framework默认分页格式：{count, next, previous, results}
        this.loginLogs = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        this.$message.error('获取登录日志失败')
        console.error('获取登录日志失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 搜索
    handleSearch() {
      if (this.dateRange && this.dateRange.length === 2) {
        this.searchParams.startTime = this.dateRange[0]
        this.searchParams.endTime = this.dateRange[1]
      } else {
        this.searchParams.startTime = ''
        this.searchParams.endTime = ''
      }
      this.pagination.currentPage = 1
      this.loadLoginLogs()
    },
    
    // 重置
    handleReset() {
      this.searchParams = {
        username: '',
        loginIp: '',
        startTime: '',
        endTime: ''
      }
      this.dateRange = []
      this.loadLoginLogs()
    },
    
    // 查看详情
    async viewDetails(row) {
      try {
        const response = await getLoginLogDetail(row.id)
        this.selectedLog = response || {}
        this.detailDialogVisible = true
      } catch (error) {
        this.$message.error('获取登录日志详情失败')
        console.error('获取登录日志详情失败:', error)
      }
    },
    
    // 分页大小改变
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.loadLoginLogs()
    },
    
    // 当前页改变
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.loadLoginLogs()
    }
  }
}
</script>

<style scoped>
.log-container {
  padding: 20px;
}
.search-container {
  margin-bottom: 20px;
}
</style>
  