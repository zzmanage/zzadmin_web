<template>
  <div class="message-container">
    <!-- 操作按钮-->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
      <el-button type="primary" @click="openAddMessageDialog">发送消息</el-button>
    </div>
    
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="我接收的" name="received">
        <el-table :data="receivedMessages" style="width: 100%" v-loading="loading">
          <template #empty>
            <div style="padding: 40px; text-align: center;">
              <el-empty description="暂无消息"></el-empty>
            </div>
          </template>
          <el-table-column label="消息类型" width="100">
            <template #default="scope">
              <el-tag type="info" v-if="getNestedValue(scope.row, 'message.message_type')">
                {{ getMessageTypeLabel(getNestedValue(scope.row, 'message.message_type')) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="80">
            <template #default="scope">
              <el-tag v-if="getNestedValue(scope.row, 'message.priority') === 2" type="danger">紧急</el-tag>
              <el-tag v-else-if="getNestedValue(scope.row, 'message.priority') === 1" type="warning">重要</el-tag>
              <el-tag v-else type="info">普通</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标题" min-width="180">
            <template #default="scope">
              <span>{{ getNestedValue(scope.row, 'message.title') || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="发送人" width="120">
            <template #default="scope">
              <span>{{ getSenderName(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170" sortable>
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="140">
            <template #default="scope">
              <el-tag :type="scope.row.is_read ? 'info' : 'primary'" size="small">
                {{ scope.row.is_read ? '已读' : '未读' }}
              </el-tag>
              <el-tag :type="scope.row.is_processed ? 'success' : 'warning'" size="small" style="margin-left: 4px;">
                {{ scope.row.is_processed ? '已处理' : '未处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="scope">
              <el-button size="small" type="info" @click="viewReceivedMessageDetails(scope.row)" style="margin-right: 5px;">详情</el-button>
              
              <!-- 下拉菜单 -->
              <el-dropdown trigger="click">
                <el-button size="small">
                  更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="!scope.row.is_read" @click="markAsRead(scope.row.id)">
                      标记已读
                    </el-dropdown-item>
                    <el-dropdown-item v-if="!scope.row.is_processed" @click="markAsProcessed(scope.row.id)">
                      标记已处理
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="我发送的" name="sent">
        <el-table :data="sentMessages" style="width: 100%">
          <el-table-column prop="message_type" label="消息类型" width="100">
            <template #default="scope">
              <el-tag type="info" v-if="scope.row.message_type">
                {{ getMessageTypeLabel(scope.row.message_type) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.priority === 2" type="danger">紧急</el-tag>
              <el-tag v-else-if="scope.row.priority === 1" type="warning">重要</el-tag>
              <el-tag v-else type="info">普通</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="180">
            <template #default="scope">
              <span>{{ scope.row.title || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="发送人" width="120">
            <template #default="scope">
              <span>{{ getSenderName(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="receive_type" label="接收类型" width="120">
            <template #default="scope">
              <span>{{ getReceiveTypeName(scope.row.receive_type) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getMessageStatusType(scope.row.status)" size="small">
                {{ getMessageStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170" sortable>
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="scope">
              <el-button size="small" type="info" @click="viewSentMessageDetails(scope.row)" style="margin-right: 5px;">详情</el-button>
              
              <!-- 下拉菜单 -->
              <el-dropdown trigger="click">
                <el-button size="small">
                  更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openEditMessageDialog(scope.row)">
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteMessage(scope.row.id)">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 分页控件 -->
    <div style="margin-top: 20px; text-align: right;">
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

    <!-- 添加/编辑消息对话-->
    <el-dialog 
      :title="isEditing  ? '编辑消息' : '添加消息'" 
      v-model="dialogVisible" 
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form :model="currentMessage" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="currentMessage.title" placeholder="请输入标题" clearable/>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input type="textarea" v-model="currentMessage.content" placeholder="请输入内容" :rows="5"/>
        </el-form-item>
        <el-form-item label="是否已读">
          <el-switch v-model="currentMessage.is_read" :active-color="'#13ce66'" :inactive-color="'#ff4949'" />
        </el-form-item>
        <el-form-item label="接收类型" prop="receive_type">
          <el-select v-model="currentMessage.receive_type" placeholder="请选择接收类型">
            <el-option label="全部用户" :value="0" />
            <el-option label="部门" :value="1" />
            <el-option label="角色" :value="2" />
            <el-option label="指定用户" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentMessage.receive_type !== 0" label="接收目标">
          <el-select v-model="currentMessage.receive_target" placeholder="请选择接收目标">
            <template v-if="currentMessage.receive_type === 1">
              <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
            </template>
            <template v-else-if="currentMessage.receive_type === 2">
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
            </template>
            <template v-else-if="currentMessage.receive_type === 3">
              <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select v-model="currentMessage.message_type" placeholder="请选择消息类型">
            <el-option label="系统通知" value="system" />
            <el-option label="告警通知" value="alert" />
            <el-option label="公告" value="announcement" />
            <el-option label="任务通知" value="task" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="currentMessage.priority" placeholder="请选择优先级">
            <el-option label="普通" :value="0" />
            <el-option label="重要" :value="1" />
            <el-option label="紧急" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送人">
          <el-input v-model="currentUser.name" placeholder="发送人" disabled />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMessage">{{ isEditing ? '更新' : '发送消息' }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 消息详情对话-->
    <el-dialog title="消息详情" v-model="detailVisible" width="800px">
      <div class="message-detail">
        <div class="detail-header">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3>{{ detailMessage.title }}</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <el-tag v-if="detailMessage.message_type" type="info">
                {{ getMessageTypeLabel(detailMessage.message_type) }}
              </el-tag>
              <el-tag v-if="detailMessage.priority === 2" type="danger">紧急</el-tag>
              <el-tag v-else-if="detailMessage.priority === 1" type="warning">重要</el-tag>
              <el-tag v-else type="info">普通</el-tag>
              <el-tag :type="detailMessage.is_read ? 'success' : 'danger'">
                {{ detailMessage.is_read ? '已读' : '未读' }}
              </el-tag>
            </div>
          </div>
          <div class="detail-meta">
            <span><strong>发送者：</strong>{{ detailMessage.sender_name || '系统' }}</span>
            <span style="margin: 0 10px;">|</span>
            <span><strong>创建时间：</strong>{{ formatDate(detailMessage.created_at) }}</span>
            <span v-if="detailMessage.read_at" style="margin-left: 10px;">
              <span style="margin-right: 10px;">|</span>
              <strong>阅读时间：</strong>{{ formatDate(detailMessage.read_at) }}
            </span>
          </div>
        </div>
        <div class="detail-content">
          {{ detailMessage.content }}
        </div>
        <div class="detail-footer" v-if="detailMessage.receive_type !== undefined">
          <p><strong>接收类型：</strong>{{ getReceiveTypeName(detailMessage.receive_type) }}</p>
          <p v-if="detailMessage.receive_type !== 3"><strong>接收目标ID：</strong>{{ detailMessage.receive_target }}</p>
          <p v-if="detailMessage.id"><strong>消息ID：</strong>{{ detailMessage.id }}</p>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { getReceivedMessages, getMessages, createMessage as apiCreateMessage, updateMessage as apiUpdateMessage, deleteMessage as apiDeleteMessage, markAsRead as apiMarkAsRead, markAsProcessed as apiMarkAsProcessed } from '../api/message'
import { getUserList, getCurrentUser } from '../api/user'
import { getRoleList } from '../api/role'
import { getDeptList } from '../api/dept'

// 数据属性
const activeTab = ref('received')
const receivedMessages = ref([])  // 接收的消息
const sentMessages = ref([])      // 发送的消息
const messages = ref([])          // 当前显示的消息（根据标签页切换）
const loading = ref(false)
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEditing = ref(false)
const formRef = ref(null)

const currentMessage = reactive({
  id: '',
  title: '',
  content: '',
  is_read: false,
  receive_type: 0,
  receive_target: '',
  message_type: 'system',
  priority: 0
})

const detailMessage = reactive({
  id: '',
  title: '',
  content: '',
  sender_name: '',
  created_at: '',
  read_at: '',
  is_read: false,
  message_type: '',
  priority: 0,
  receive_type: undefined,
  receive_target: ''
})

// 数据列表（从后端获取）
const users = ref([])
const roles = ref([])
const departments = ref([])
const currentUser = ref({ name: '当前用户' })

// 获取用户列表
const loadUsers = async () => {
  try {
    const response = await getUserList({ page_size: 100 })
    users.value = (response.results || []).map(u => ({ id: u.id, name: u.name }))
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 获取角色列表
const loadRoles = async () => {
  try {
    const response = await getRoleList({ page_size: 100 })
    roles.value = (response.results || []).map(r => ({ id: r.id, name: r.name }))
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 获取部门列表
const loadDepartments = async () => {
  try {
    const response = await getDeptList({ page_size: 100 })
    departments.value = (response.results || []).map(d => ({ id: d.id, name: d.name }))
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

// 获取当前用户信息
const loadCurrentUser = async () => {
  try {
    const response = await getCurrentUser()
    if (response) {
      currentUser.value = { 
        id: response.id || '',
        name: response.name || response.username || '当前用户' 
      }
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
  }
}

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 50, message: '标题长度1-50个字', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 1, max: 500, message: '内容长度1-500个字', trigger: 'blur' }
  ],
  receive_type: [
    { required: true, message: '请选择接收类型', trigger: 'change' }
  ],
  receive_target: [
    { 
      validator: (rule, value, callback) => {
        if (currentMessage.receive_type !== 0 && !value) {
          callback(new Error('请选择接收目标'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ]
}

// 方法
const getMessageTypeLabel = (type) => {
  const typeMap = {
    system: '系统通知',
    alert: '告警通知',
    announcement: '公告',
    task: '任务通知'
  }
  return typeMap[type] || type
}

const getReceiveTypeName = (type) => {
  const typeMap = {
    0: '全部用户',
    1: '部门',
    2: '角色',
    3: '指定用户'
  }
  return typeMap[type] || type
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 安全获取嵌套属性
const getNestedValue = (obj, path) => {
  if (!obj) return undefined
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

// 获取发送人名称
const getSenderName = (row) => {
  try {
    // 尝试从多种可能的数据源获取发送人信息
    // 情况1: row.message 是消息对象（用于接收的消息）
    const message = row.message || {}
    
    // 情况2: 直接从 row 获取（用于发送的消息）
    // 后端返回的 sender 可能是字符串（用户名）或对象
    
    // 先检查是否为字符串类型的 sender
    const messageSender = message.sender
    const rowSender = row.sender
    
    // 如果 message.sender 是字符串，直接返回
    if (typeof messageSender === 'string') {
      return messageSender || '-'
    }
    
    // 如果 row.sender 是字符串，直接返回
    if (typeof rowSender === 'string') {
      return rowSender || '-'
    }
    
    // 如果 sender 是对象，尝试获取用户名
    const senderObj = messageSender || rowSender || message.sender_id || row.sender_id || {}
    
    // 尝试多种可能的字段，全部使用可选链确保安全
    const name = senderObj?.username || senderObj?.name || 
                 row.sender_name || row.sender_username ||
                 row.from_username || row.from_name ||
                 row.sender?.username || row.sender?.name ||
                 message.sender?.username || message.sender?.name ||
                 '-'
    
    return name
  } catch (error) {
    console.error('获取发送人名称失败:', error)
    return '-'
  }
}

// 获取消息状态标签
const getMessageStatusLabel = (status) => {
  const statusMap = {
    0: '草稿',
    1: '已发送',
    2: '已撤回',
    3: '已过期'
  }
  return statusMap[status] || status
}

// 获取消息状态类型
const getMessageStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

const loadReceivedMessages = async () => {
  loading.value = true
  try {
    const response = await getReceivedMessages({
      page: pagination.currentPage,
      page_size: pagination.pageSize
    })
    receivedMessages.value = response.results || []
    pagination.total = response.count || 0
  } catch (error) {
    receivedMessages.value = []
    pagination.total = 0
    ElMessage.error('获取消息失败')
    console.error('获取消息失败:', error)
  } finally {
    loading.value = false
  }
}

const loadSentMessages = async () => {
  loading.value = true
  try {
    const response = await getMessages({
      page: pagination.currentPage,
      page_size: pagination.pageSize
    })
    sentMessages.value = response.results || []
    pagination.total = response.count || 0
  } catch (error) {
    sentMessages.value = []
    pagination.total = 0
    ElMessage.error('获取消息失败')
    console.error('获取消息失败:', error)
  } finally {
    loading.value = false
  }
}

const viewReceivedMessageDetails = (message) => {
  detailMessage.id = message.id
  
  // 使用可选链安全访问嵌套属性
  const msg = message.message || {}
  
  detailMessage.title = msg.title || '-'
  detailMessage.content = msg.content || '-'
  
  // 使用 getSenderName 函数获取发送人名称
  detailMessage.sender_name = getSenderName(message)
  
  detailMessage.created_at = message.created_at
  detailMessage.read_at = message.read_at
  detailMessage.is_read = message.is_read
  detailMessage.message_type = msg.message_type
  detailMessage.priority = msg.priority
  detailMessage.receive_type = msg.receive_type
  detailMessage.receive_target = msg.receive_target
  detailVisible.value = true
}

const viewSentMessageDetails = (message) => {
  detailMessage.id = message.id
  detailMessage.title = message.title
  detailMessage.content = message.content
  
  // 使用 getSenderName 函数获取发送人名称，避免直接访问可能不存在的属性
  detailMessage.sender_name = getSenderName(message)
  
  detailMessage.created_at = message.created_at
  detailMessage.read_at = null
  detailMessage.is_read = null
  detailMessage.message_type = message.message_type
  detailMessage.priority = message.priority
  detailMessage.receive_type = message.receive_type
  detailMessage.receive_target = message.receive_target
  detailVisible.value = true
}

const markAsRead = async (id) => {
  try {
    await apiMarkAsRead(id)
    const message = receivedMessages.value.find(m => m.id === id)
    if (message) {
      message.is_read = true
      message.read_at = new Date().toISOString()
    }
    ElMessage.success('标记已读成功')
  } catch (error) {
    ElMessage.error('标记已读失败')
    console.error('标记已读失败:', error)
  }
}

const markAsProcessed = async (id) => {
  try {
    await apiMarkAsProcessed(id)
    const message = receivedMessages.value.find(m => m.id === id)
    if (message) {
      message.is_processed = true
    }
    ElMessage.success('标记已处理成功')
  } catch (error) {
    ElMessage.error('标记已处理失败')
    console.error('标记已处理失败', error)
  }
}

const openAddMessageDialog = () => {
  // 重置表单
  currentMessage.id = ''
  currentMessage.title = ''
  currentMessage.content = ''
  currentMessage.is_read = false
  currentMessage.receive_type = 0
  currentMessage.receive_target = ''
  currentMessage.message_type = 'system'
  currentMessage.priority = 0
  isEditing.value = false
  dialogVisible.value = true
}

const openEditMessageDialog = (message) => {
  currentMessage.id = message.id
  currentMessage.title = message.title
  currentMessage.content = message.content
  currentMessage.receive_type = message.receive_type
  currentMessage.receive_target = message.receive_target
  currentMessage.message_type = message.message_type
  currentMessage.priority = message.priority
  isEditing.value = true
  dialogVisible.value = true
}

const deleteMessage = async (id) => {
  try {
    await apiDeleteMessage(id)
    const index = sentMessages.value.findIndex(m => m.id === id)
    if (index > -1) {
      sentMessages.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
    console.error('删除失败:', error)
  }
}

const handleTabChange = (tabName) => {
  pagination.currentPage = 1
  if (tabName === 'received') {
    loadReceivedMessages()
  } else {
    loadSentMessages()
  }
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  if (activeTab.value === 'received') {
    loadReceivedMessages()
  } else {
    loadSentMessages()
  }
}

const handleCurrentChange = (current) => {
  pagination.currentPage = current
  if (activeTab.value === 'received') {
    loadReceivedMessages()
  } else {
    loadSentMessages()
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
  if (formRef.value) {
    formRef.value.resetFields()
  }
  currentMessage.id = ''
  currentMessage.title = ''
  currentMessage.content = ''
  currentMessage.is_read = false
  currentMessage.receive_type = 0
  currentMessage.receive_target = ''
  currentMessage.message_type = 'system'
  currentMessage.priority = 0
  isEditing.value = false
}

const saveMessage = async () => {
  if (!formRef.value) return
  
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = {
          title: currentMessage.title,
          content: currentMessage.content,
          receive_type: Number(currentMessage.receive_type),
          receive_target: currentMessage.receive_type === 0 ? null : Number(currentMessage.receive_target),
          message_type: currentMessage.message_type,
          priority: Number(currentMessage.priority)
        }
        
        if (isEditing.value) {
          await apiUpdateMessage(currentMessage.id, data)
          const index = sentMessages.value.findIndex(m => m.id === currentMessage.id)
          if (index > -1) {
            sentMessages.value[index] = { ...sentMessages.value[index], ...data }
          }
          ElMessage.success('更新成功')
        } else {
          await apiCreateMessage(data)
          ElMessage.success('发送消息成功')
          // 刷新发送的消息列表
          loadSentMessages()
        }
        dialogVisible.value = false
        handleDialogClose()
      } catch (error) {
        ElMessage.error(isEditing.value ? '更新失败' : '发送失败')
        console.error('保存消息失败:', error)
      }
    }
  })
}

// 生命周期
onMounted(() => {
  loadReceivedMessages()
  loadUsers()
  loadRoles()
  loadDepartments()
  loadCurrentUser()
})
</script>

<style scoped>
.message-container {
  padding: 20px;
}

.message-detail {
  padding: 20px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-meta {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

.detail-content {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.detail-footer {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
