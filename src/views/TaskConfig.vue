<template>
  <div class="task-config-container">
    <div class="header">
      <h1>任务配置</h1>
    </div>
    
    <el-card class="search-container">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 120px;">
            <el-option label="全部" value="" />
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAdd">新增任务</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table border
      v-loading="loading"
      :data="taskList"
      style="width: 100%"
    >
      <el-table-column prop="id" label="任务ID" width="80" />
      <el-table-column prop="name" label="任务名称" />
      <el-table-column prop="task" label="任务路径" />
      <el-table-column prop="cron_expression" label="Cron表达式" />
      <el-table-column prop="enabled" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'danger'" class="status-tag">
            {{ scope.row.enabled ? '启用' : '禁用' }}
          </el-tag>
          <el-switch 
            :model-value="scope.row.enabled" 
            active-color="#13ce66" 
            inactive-color="#ff4949" 
            size="small" 
            @change="(value) => handleStatusChange(scope.row, value)"
            style="margin-left: 8px;"
            :loading="scope.row.statusChanging"
          />
        </template>
      </el-table-column>
      <el-table-column prop="last_run_at" label="最后执行时间" width="180" sortable />
      <el-table-column prop="date_changed" label="更新时间" width="180" sortable />
      <el-table-column prop="total_run_count" label="运行次数" width="100" sortable />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button @click="handleEdit(scope.row)" type="primary" size="small" icon="Edit">编辑</el-button>
          <el-button @click="handleDelete(scope.row)" type="danger" size="small" icon="Delete">删除</el-button>
          <el-button @click="handleExecuteTask(scope.row)" type="warning" size="small" icon="RefreshRight">执行</el-button>
          <el-button @click="handleViewLogs(scope.row)" type="default" size="small" icon="View">日志</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
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

    <!-- 新增/编辑任务弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增任务' : '编辑任务'"
      width="50%"
    >
      <el-form ref="taskFormRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务路径" prop="task">
          <el-select v-model="formData.task" placeholder="请选择任务路径">
            <el-option v-for="task in availableTasks" :key="task.name" :label="task.name + ' - ' + task.description" :value="task.name" />
          </el-select>
          <div class="task-description" v-if="selectedTaskDescription">{{ selectedTaskDescription }}</div>
        </el-form-item>
    
        <el-form-item label="定时类型" prop="scheduleType">
          <el-radio-group v-model="formData.scheduleType" @change="handleScheduleTypeChange">
            <el-radio label="crontab">Cron表达式</el-radio>
            <el-radio label="interval">间隔时间</el-radio>
          </el-radio-group>
        </el-form-item>
    
        <div v-if="formData.scheduleType === 'crontab'">
          <el-form-item label="Cron表达式">
            <div class="cron-inputs">
              <el-input v-model="formData.cron.minute" placeholder="分" style="width: 80px" />
              <span class="separator"> </span>
              <el-input v-model="formData.cron.hour" placeholder="小时" style="width: 80px" />
              <span class="separator"> </span>
              <el-input v-model="formData.cron.day_of_month" placeholder="日" style="width: 80px" />
              <span class="separator"> </span>
              <el-input v-model="formData.cron.month_of_year" placeholder="月" style="width: 80px" />
              <span class="separator"> </span>
              <el-input v-model="formData.cron.day_of_week" placeholder="周" style="width: 80px" />
            </div>
            <div class="cron-preview">预览: {{ cronExpressionPreview }}</div>
          </el-form-item>
        </div>
    
        <div v-if="formData.scheduleType === 'interval'">
          <el-form-item label="间隔时间">
            <el-input-number v-model="formData.interval.every" :min="1" style="width: 120px" />
            <el-select v-model="formData.interval.period" placeholder="选择单位" style="margin-left: 10px; width: 120px">
              <el-option label="分钟" value="minutes" />
              <el-option label="小时" value="hours" />
              <el-option label="天" value="days" />
              <el-option label="周" value="weeks" />
            </el-select>
          </el-form-item>
        </div>
    
        <el-form-item label="任务参数">
          <el-input
            v-model="taskParamsJson"
            type="textarea"
            :rows="8"
            placeholder="请输入标准JSON格式的参数，如：{'key': 'value'}"
            style="width: 100%"
            @input="debouncedValidateParams(taskParamsJson)"
          />
          <div class="param-help-text">
            <p>格式要求：标准JSON字典格式，键值对使用英文双引号</p>
            <p>支持的数据类型：字符串、数字、布尔值、嵌套JSON对象</p>
            <p>所有参数将作为kwargs传递给后端函数</p>
            <p>支持添加注释（/* 块注释 */ // 行注释），提交时会自动移除</p>
          </div>
          <el-button 
            type="primary" 
            size="small" 
            style="margin-top: 10px"
            @click="validateTaskParams"
          >
            验证参数格式
          </el-button>
          <el-button 
            type="default" 
            size="small" 
            style="margin-top: 10px; margin-left: 10px"
            @click="formatTaskParams"
          >
            格式化JSON
          </el-button>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入任务描述" />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-switch v-model="formData.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 任务日志查看-->
    <TaskLogViewer 
      ref="taskLogViewerRef" 
      :task-id="selectedTaskId" 
      :task-name="selectedTaskName"
      @close="handleLogViewerClose"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTasks, addTask, updateTask, deleteTask, enableTask, disableTask, getAvailableTasks, executeTask, enableTaskById, disableTaskById, executeTaskById } from '../api/task'
import TaskLogViewer from '../components/TaskLogViewer.vue' // 导入任务日志查看组件
export default {
  name: 'TaskConfig',
  components: {
    TaskLogViewer
  },
  setup() {
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('add')
    const taskFormRef = ref(null)
    const taskLogViewerRef = ref(null)
    const selectedTaskId = ref(null)
    const selectedTaskName = ref('')
    const taskList = ref([])
    const availableTasks = ref([])
    const selectedTaskDescription = ref('')
    const taskParamsJson = ref('') // 单一文本框存储的JSON参数
    const searchForm = reactive({
      name: '',
      status: ''
    })
    
    const formData = reactive({
      id: '',
      name: '',
      task: '', // 对应后端的task字段，即任务函数路径
      scheduleType: 'crontab', // 'crontab' 'interval'
      cron: {
        minute: '*',
        hour: '*',
        day_of_week: '*',
        day_of_month: '*',
        month_of_year: '*',
        id: null
      },
      interval: {
        every: 1,
        period: 'minutes',
        id: null
      },
      description: '',
      enabled: true // 对应后端的enabled字段
    })
    
    const formRules = {
      name: [
        { required: true, message: '请输入任务名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度2-50个字', trigger: 'blur' }
      ],
      task: [
        { required: true, message: '请选择任务路径', trigger: 'change' },
        { min: 2, max: 100, message: '长度2-100个字', trigger: 'change' }
      ],
      enabled: [
        { required: false }
      ]
    }
    
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 计算Cron表达式预览
    const cronExpressionPreview = computed(() => {
      const cron = formData.cron
      return `${cron.minute} ${cron.hour} ${cron.day_of_month} ${cron.month_of_year} ${cron.day_of_week}`
    })
    
    // 计算必填参数列表已移除，因为不再从task_parameters接口获取参数信息
    
    // 验证任务参数格式 - 增强版：支持忽略注释和更好的错误提示
    const validateTaskParams = () => {
      if (!taskParamsJson.value.trim()) {
        ElMessage.warning('参数为空')
        return true
      }
      try {
        // 预处理：移除注释（简单实现）
        let cleanJson = taskParamsJson.value
          .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
          .replace(/\/\/.*$/gm, '') // 移除行注释
          .trim()
          
        if (!cleanJson) {
          ElMessage.warning('参数仅包含注释')
          return true
        }
          
        const parsedParams = JSON.parse(cleanJson)
        if (typeof parsedParams !== 'object' || parsedParams === null || Array.isArray(parsedParams)) {
          ElMessage.error('参数必须是一个JSON对象')
          return false
        }
        ElMessage.success('参数格式正确')
        return true
      } catch (e) {
        ElMessage.error(`参数格式错误: ${e.message}`)
        return false
      }
    }
      
    // 实时验证任务参数格式
    const debouncedValidateParams = debounce((value) => {
      if (value && value.trim()) {
        try {
          // 简单验证，不显示消息
          const cleanJson = value
            .replace(/\/\*[\s\S]*\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .trim()
            
          if (cleanJson) {
            JSON.parse(cleanJson)
          }
        } catch (e) {
          // 仅记录错误，不干扰用户编辑
        }
      }
    }, 500)
      
    // 防抖函数
    function debounce(fn, delay) {
      let timeoutId
      return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn.apply(this, args), delay)
      }
    }
      
    // 监听任务参数变化，进行实时验证
    watch(() => taskParamsJson.value, (newValue) => {
      debouncedValidateParams(newValue)
    })
    
    // 监听任务选择变化
    watch(() => formData.task, async (newTask) => {
      if (newTask) {
        selectedTaskDescription.value = availableTasks.value.find(t => t.name === newTask).description || ''
        // 重置任务参数
        if (dialogType.value === 'add') {
          taskParamsJson.value = ''
        }
      }
    })
    
    // 获取可用任务列表
    const fetchAvailableTasks = async () => {
      try {
        const res = await getAvailableTasks()
        availableTasks.value = res
      } catch (error) {
        ElMessage.error('获取可用任务列表失败')
        console.error('获取可用任务列表失败:', error)
      }
    }
    
    // 重置任务参数表单（仅用于新增任务）
    const resetTaskFormParams = () => {
      taskParamsJson.value = ''
    }
    
    // 处理定时类型变更
    const handleScheduleTypeChange = () => {
      // 根据选择的定时类型重置相应的表单数据
      if (formData.scheduleType === 'crontab') {
        formData.cron = {
          minute: '*',
          hour: '*',
          day_of_week: '*',
          day_of_month: '*',
          month_of_year: '*',
          id: null
        }
      } else {
        formData.interval = {
          every: 1,
          period: 'minutes',
          id: null
        }
      }
    }
    
    // 获取任务列表
    const loadTasks = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          name: searchForm.name,
          enabled: searchForm.status !== '' ? searchForm.status === '1' : undefined
        }
        const res = await getTasks(params)
                  
        // 处理任务列表数据，适配前端展示
        taskList.value = res.results.map(task => ({
          ...task,
          cron_expression: task.crontab
            ? `${task.crontab.minute} ${task.crontab.hour} ${task.crontab.day_of_month} ${task.crontab.month_of_year} ${task.crontab.day_of_week}`
            : task.cron_expression,
          enabled: task.enabled !== undefined ? task.enabled : task.status === 1, // 统一使用enabled字段
          total_run_count: task.total_run_count || 0 // 确保运行次数有默认
        }))
        pagination.total = res.count || 0
      } catch (error) {
        ElMessage.error('获取任务列表失败')
        console.error('获取任务列表失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 查询
    const handleSearch = () => {
      pagination.currentPage = 1
      loadTasks()
    }
    
    // 重置
    const handleReset = () => {
      searchForm.name = ''
      searchForm.status = ''
      pagination.currentPage = 1
      loadTasks()
    }
    
    // 新增任务
    const handleAdd = () => {
      dialogType.value = 'add'
      resetFormData()
      dialogVisible.value = true
    }
    
    // 编辑任务 - 优化版：增强任务参数的JSON解析和格式化
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      formData.id = row.id
      formData.name = row.name
      formData.task = row.task || row.code // 兼容前端显示的code字段
      formData.description = row.description || ''
      formData.enabled = row.enabled !== undefined ? row.enabled : row.status === 1 // 统一使用enabled字段
      
      // 设置任务描述
      selectedTaskDescription.value = availableTasks.value.find(t => t.name === formData.task).description || ''
      
      // 确定定时类型
      if (row.interval) {
        formData.scheduleType = 'interval'
        formData.interval = {
          ...row.interval,
          id: row.interval.id
        }
      } else {
        formData.scheduleType = 'crontab'
        // 如果有crontab信息，解析到cron对象
        if (row.crontab) {
          formData.cron = {
            ...row.crontab,
            id: row.crontab.id
          }
        } else if (row.cron_expression) {
          // 从cron表达式解析各字段
          const parts = row.cron_expression.split(' ')
          if (parts.length === 5) {
            formData.cron = {
              minute: parts[0],
              hour: parts[1],
              day_of_month: parts[2],
              month_of_year: parts[3],
              day_of_week: parts[4],
              id: null
            }
          }
        }
      }
      
      // 优化版：增强任务参数的JSON解析和格式化
      taskParamsJson.value = formatTaskParamsForEditing(row)
      
      dialogVisible.value = true
    }
    
    // 格式化任务参数以便编辑，增强JSON解析和错误处理
    const formatTaskParamsForEditing = (row) => {
      try {
        // 优先使用kwargs_json字段
        if (row.kwargs_json) {
          // 尝试解析JSON
          const parsedKwargs = JSON.parse(row.kwargs_json)
          // 确保返回格式化的JSON
          return JSON.stringify(parsedKwargs, null, 2)
        } else if (row.kwargs) {
          // 兼容旧格式的kwargs，可能是字符串或对象
          if (typeof row.kwargs === 'string') {
            const parsedKwargs = JSON.parse(row.kwargs)
            return JSON.stringify(parsedKwargs, null, 2)
          } else if (typeof row.kwargs === 'object' && row.kwargs !== null) {
            return JSON.stringify(row.kwargs, null, 2)
          }
        }
        // 对于空参数，提供一个示例格式
        return '{}'
      } catch (e) {
        console.warn('解析任务参数失败:', e)
        // 在输入框中显示错误信息，以便用户修正
        return `/* 解析参数失败，请修正${e.message} */\n{}`
      }
    }
    
    // 删除任务
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm(`确定要删除任务${row.name}吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await deleteTask(row.id)
        ElMessage.success('删除成功')
        loadTasks()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
    }
    
    // 切换任务状态
    const handleToggleStatus = async (row, targetStatus) => {
      try {
        // 根据目标状态决定调用哪个API，而不是依赖当前row.enabled的值
        if (!targetStatus) {
          // 禁用任务
          const result = await disableTaskById(row.id)
                    ElMessage.success('禁用成功')
        } else {
          // 启用任务
          const result = await enableTaskById(row.id)
                    ElMessage.success('启用成功')
        }
        // 刷新任务列表，确保数据与后端一致
        loadTasks()
      } catch (error) {
        ElMessage.error('操作失败')
        console.error('切换任务状态失', error)
        // 显示更详细的错误信息
        if (error.response && error.response.data) {
          console.error('错误详情:', error.response.data)
          if (error.response.data.detail) {
            ElMessage.error(error.response.data.detail)
          } else if (error.response.data.message) {
            ElMessage.error(error.response.data.message)
          }
        }
        // 抛出错误，让上层函数处理状态恢复
        throw error
      }
    }
    
    // 开关切换状态处理
    const handleStatusChange = async (row, newValue) => {
      // 标记当前行正在处理状态切换
      row.statusChanging = true
      // 保存原始状态以便失败时恢复
      const originalStatus = row.enabled
      try {
        // 调用状态切换方法，但不直接依赖row.enabled的变化
        await handleToggleStatus(row, newValue)
        // API调用成功后，手动更新当前行的enabled状态
        row.enabled = newValue
      } catch (error) {
        // 恢复原始状态
        ElMessage.error('状态切换失败')
      } finally {
        // 无论成功失败，都清除加载状态
        row.statusChanging = false
      }
    }
    
    // 执行任务 - 修复版：使用正确的API端点
    const handleExecuteTask = async (row) => {
      try {
        await ElMessageBox.confirm(`确定要立即执行任务${row.name}吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        })
        
        // 调用封装的执行任务API
        const result = await executeTaskById(row.id)
                ElMessage.success('任务已开始执行，请稍后查看任务日志')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('执行失败')
          console.error('执行任务失败:', error)
          // 显示更详细的错误信息
          if (error.response && error.response.data) {
            console.error('错误详情:', error.response.data)
            if (error.response.data.detail) {
              ElMessage.error(error.response.data.detail)
            } else if (error.response.data.message) {
              ElMessage.error(error.response.data.message)
            }
          }
        }
      }
    }
    
    // 查看任务日志 - 优化版：添加加载中状态和错误处理
    const handleViewLogs = async (row) => {
      // 显示加载中状态
      ElMessage({ message: '正在打开日志查看...', type: 'info' })
      
      try {
        // 1. 先设置任务ID和名称
        selectedTaskId.value = row.id
        selectedTaskName.value = row.name
        
        // 2. 等待Vue的响应式更新完成，确保子组件接收到最新的taskId
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 3. 再调用open方法
        if (taskLogViewerRef.value && typeof taskLogViewerRef.value.open === 'function') {
          taskLogViewerRef.value.open()
        } else {
          // 备用打开方式，直接导航到任务日志页面
          ElMessage.warning('使用备用方式打开任务日志')
          window.open(`/api/task_logs?task_id=${row.id}`, '_blank')
        }
      } catch (error) {
        ElMessage.error('打开日志查看器失败')
        console.error('打开日志查看器失败', error)
      }
    }
    
    // 关闭日志查看器
    const handleLogViewerClose = () => {
      selectedTaskId.value = null
      selectedTaskName.value = ''
    }
    
    // 格式化JSON参数
    const formatTaskParams = () => {
      if (!taskParamsJson.value.trim()) {
        ElMessage.warning('没有可格式化的参数')
        return
      }
          
      try {
        // 预处理：移除注释
        let cleanJson = taskParamsJson.value
          .replace(/\/\*[\s\S]*\*\//g, '')
          .replace(/\/\/.*$/gm, '')
          .trim()
            
        if (!cleanJson) {
          ElMessage.warning('参数仅包含注释')
          return
        }
            
        const parsedParams = JSON.parse(cleanJson)
        if (typeof parsedParams !== 'object' || parsedParams === null || Array.isArray(parsedParams)) {
          ElMessage.error('参数必须是一个JSON对象')
          return
        }
            
        // 使用2个空格缩进格式化JSON
        taskParamsJson.value = JSON.stringify(parsedParams, null, 2)
        ElMessage.success('JSON格式化成功')
      } catch (e) {
        ElMessage.error(`格式化失败: ${e.message}`)
        console.error('JSON格式化失', e)
      }
    }
        
    // 提交表单 - 修复版：确保与后端API格式匹配
    const handleSubmit = async () => {
      try {
        await taskFormRef.value.validate()
            
        // 准备任务参数，统一解析JSON格式
        let args = []
        let kwargs = {}
            
        // 解析任务参数JSON - 增强版：支持移除注释
        if (taskParamsJson.value.trim()) {
          try {
            // 预处理：移除注释
            let cleanJson = taskParamsJson.value
              .replace(/\/\*[\s\S]*\*\//g, '')
              .replace(/\/\/.*$/gm, '')
              .trim()
                
            if (cleanJson) {
              const parsedParams = JSON.parse(cleanJson)
              // 如果是数组，当作args处理；如果是对象，当作kwargs处理
              if (Array.isArray(parsedParams)) {
                args = parsedParams
              } else if (typeof parsedParams === 'object' && parsedParams !== null) {
                kwargs = parsedParams
              } else {
                ElMessage.error('参数必须是一个JSON对象或数组')
                return
              }
            }
          } catch (e) {
            ElMessage.error(`参数格式错误: ${e.message}`)
            console.error('参数解析失败:', e)
            return
          }
        }
            
                    
        // 准备提交数据，确保与后端PeriodicTaskSerializer匹配
        const submitData = {
          name: formData.name,
          task: formData.task,
          description: formData.description,
          enabled: formData.enabled,
          args: JSON.stringify(args),  // 后端期望的字段名是args
          kwargs: JSON.stringify(kwargs),  // 后端期望的字段名是kwargs
          queue: formData.queue || 'default',
          priority: formData.priority || 0
        }
            
        // 根据定时类型处理schedule数据
        if (formData.scheduleType === 'crontab' && formData.cron) {
          // 创建 crontab 调度
          try {
            // 直接将cron数据传递给后端，不先创建调度器
            submitData.crontab = {
              minute: formData.cron.minute,
              hour: formData.cron.hour,
              day_of_week: formData.cron.day_of_week,
              day_of_month: formData.cron.day_of_month,
              month_of_year: formData.cron.month_of_year
            }
                      } catch (e) {
            console.error('设置定时调度失败:', e)
            ElMessage.error('设置定时调度失败: ' + e.message)
            return
          }
        } else if (formData.scheduleType === 'interval' && formData.interval) {
          // 处理interval调度
          try {
            if (!formData.interval.every || !formData.interval.period) {
              throw new Error('间隔时间的数字和单位不能为空')
            }
                
            // 直接将interval数据传递给后端，不先创建调度器
            submitData.interval = {
              every: formData.interval.every,
              period: formData.interval.period
            }
                      } catch (e) {
            console.error('设置间隔调度失败:', e)
            ElMessage.error('设置间隔调度失败: ' + e.message)
            return
          }
        }
            
        // 确保不包含冲突的调度字段
        if (formData.scheduleType === 'crontab') {
          delete submitData.interval
        } else if (formData.scheduleType === 'interval') {
          delete submitData.crontab
        }
            
                    
        // 区分新增和编辑
        try {
          if (dialogType.value === 'add') {
            await addTask(submitData)
            ElMessage.success('新增成功')
          } else {
            await updateTask(formData.id, submitData)
            ElMessage.success('更新成功')
          }
        } catch (e) {
          console.error('保存任务失败:', e)
          ElMessage.error('保存任务失败: ' + (e.message || '未知错误'))
          return
        }
            
        dialogVisible.value = false
        loadTasks()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(`${dialogType.value === 'add' ? '新增' : '更新'}失败`)
          console.error(`${dialogType.value === 'add' ? '新增' : '更新'}任务失败:`, error)
          // 显示更详细的错误信息
          if (error.response && error.response.data) {
            console.error('错误详情:', error.response.data)
            if (error.response.data.detail) {
              ElMessage.error(error.response.data.detail)
            } else if (error.response.data.message) {
              ElMessage.error(error.response.data.message)
            }
          }
        }
      }
    }
    
    // 重置表单数据
    const resetFormData = () => {
      formData.id = ''
      formData.name = ''
      formData.task = ''
      formData.scheduleType = 'crontab'
      formData.cron = {
        minute: '*',
        hour: '*',
        day_of_week: '*',
        day_of_month: '*',
        month_of_year: '*',
        id: null
      }
      formData.interval = {
        every: 1,
        period: 'minutes',
        id: null
      }
      formData.description = ''
      formData.enabled = true
      
      selectedTaskDescription.value = ''
      resetTaskFormParams()
      
      if (taskFormRef.value) {
        taskFormRef.value.resetFields()
      }
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadTasks()
    }
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadTasks()
    }
    
    // 组件挂载时加载数据
    onMounted(async () => {
      await fetchAvailableTasks()
      loadTasks()
    })
    
    return {
      loading,
      dialogVisible,
      dialogType,
      taskFormRef,
      taskLogViewerRef,
      selectedTaskId,
      selectedTaskName,
      taskList,
      searchForm,
      formData,
      formRules,
      pagination,
      cronExpressionPreview,
      availableTasks,
      selectedTaskDescription,
      taskParamsJson,
      handleSearch,
      handleReset,
      handleAdd,
      handleEdit,
      handleDelete,
      handleToggleStatus,
      handleStatusChange,
      handleExecuteTask,
      handleViewLogs,
      handleLogViewerClose,
      handleSubmit,
      handleSizeChange,
      handleCurrentChange,
      validateTaskParams,
      formatTaskParams,
      debouncedValidateParams
    }
  }
}
</script>

<style scoped>
.task-config-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* Cron表达式输入样*/
.cron-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.separator {
  color: #606266;
  font-size: 16px;
}

/* 表格操作按钮样式 */
.el-table .el-button {
  margin-right: 5px;
}

/* 任务描述样式 */
.task-description {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

/* 动态参数样*/
.dynamic-params {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.required-mark {
  color: #f56c6c;
  font-size: 14px;
}

.no-params {
  padding: 8px;
  color: #909399;
  font-size: 14px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.loading {
  padding: 8px;
  color: #909399;
  font-size: 14px;
}

/* Cron预览样式 */
.cron-preview {
  margin-top: 8px;
  padding: 6px 12px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  color: #1890ff;
  font-size: 14px;
}
    
    .form-item-margin {
      margin-right: 20px;
    }
    
    .status-tag {
      vertical-align: middle;
    }
    
    .el-table .cell {
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .el-button--small {
      margin-right: 5px;
      padding: 6px 12px;
    }
    
    /* 表格行悬停效果增*/
    .el-table--enable-row-hover .el-table__body tr:hover > td {
      background-color: #f5f7fa;
    }
    
    /* 搜索框和按钮组样式优*/
    .el-form-item {
      margin-bottom: 15px;
    }
    
    /* 增强时间列格式化显示 */
    .el-table-column--date {
      min-width: 180px;
    }
  </style>