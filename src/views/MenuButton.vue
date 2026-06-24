<template>
  <div class="menu-button">
    <h1>按钮配置</h1>
    
    <!-- 查询条件区域 -->
    <el-card class="search-container">
      <div style="margin-bottom: 15px;">
        <el-button type="primary" @click="openAddDialog">新增按钮</el-button>
      </div>
    </el-card>
    
    <!-- 按钮列表 -->
    <el-table :data="menuButtons" border style="margin-top: 20px" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" type="index"/>
      <el-table-column prop="name" label="按钮名称" min-width="120"/>
      <el-table-column prop="value" label="权限标识" min-width="120"/>
      <el-table-column prop="api" label="接口地址" min-width="150"/>
      <el-table-column prop="method" label="请求方法" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.method === 0" type="info">GET</el-tag>
          <el-tag v-else-if="scope.row.method === 1" type="success">POST</el-tag>
          <el-tag v-else-if="scope.row.method === 2" type="warning">PUT</el-tag>
          <el-tag v-else-if="scope.row.method === 3" type="danger">DELETE</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加按钮弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增按钮" width="500px">
      <el-form ref="addButtonForm" :model="newButton" :rules="rules" label-width="100px">
        <el-form-item label="按钮名称" prop="name">
          <el-select v-model="newButton.name" placeholder="请选择按钮名称" filterable @change="handleButtonNameChange">
            <el-option v-for="button in availableButtons" :key="button.id" :label="button.name" :value="button.name"/>
          </el-select>
        </el-form-item>
        <!-- 隐藏权限值输入框，系统会根据按钮名称自动设置 -->
        <el-form-item label="权限" prop="value" v-show="false">
          <el-input v-model="newButton.value" placeholder="请输入权限" />
        </el-form-item>
        <el-form-item label="接口地址" prop="api">
          <el-select v-model="newButton.api" placeholder="请选择接口地址" filterable>
            <el-option v-for="api in availableApis" :key="api.url" :label="api.url" :value="api.url"/>
          </el-select>
        </el-form-item>
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="newButton.method" placeholder="请选择请求方法">
            <el-option label="GET" :value="0"/>
            <el-option label="POST" :value="1"/>
            <el-option label="PUT" :value="2"/>
            <el-option label="DELETE" :value="3"/>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addButton">确定</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 编辑按钮弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑按钮" width="500px">
      <el-form ref="editButtonForm" :model="currentButton" :rules="rules" label-width="100px">
        <el-form-item label="按钮名称" prop="name">
          <el-select v-model="currentButton.name" placeholder="请选择按钮名称" filterable @change="handleEditButtonNameChange">
            <el-option v-for="button in availableButtons" :key="button.id" :label="button.name" :value="button.name"/>
          </el-select>
        </el-form-item>
        <!-- 隐藏权限值输入框，系统会根据按钮名称自动设置 -->
        <el-form-item label="权限" prop="value" v-show="false">
          <el-input v-model="currentButton.value" placeholder="请输入权限" />
        </el-form-item>
        <el-form-item label="接口地址" prop="api">
          <el-select v-model="currentButton.api" placeholder="请选择接口地址" filterable>
            <el-option v-for="api in availableApis" :key="api.url" :label="api.url" :value="api.url"/>
          </el-select>
        </el-form-item>
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="currentButton.method" placeholder="请选择请求方法">
            <el-option label="GET" :value="0"/>
            <el-option label="POST" :value="1"/>
            <el-option label="PUT" :value="2"/>
            <el-option label="DELETE" :value="3"/>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateButton">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getMenuButtonList, createMenuButton, updateMenuButton, deleteMenuButton } from '../api/menuButton'
import { getAllButtons } from '../api/button'
import { getAllApiEndpoints } from '../api/apiEndpoint'
import { getMenuDetail } from '../api/menu'

export default {
  data() {
    return {
      menuId: '',
      menuInfo: {},
      menuButtons: [],
      loading: false,
      addDialogVisible: false,
      editDialogVisible: false,
      newButton: {
        menu_id: '',
        name: '',
        value: '',
        api: '',
        method: 0
      },
      currentButton: {
        id: 0,
        menu_id: '',
        name: '',
        value: '',
        api: '',
        method: 0
      },
      rules: {
        name: [
          { required: true, message: '请选择按钮名称', trigger: 'change' }
        ],
        // 隐藏的权限值字段，不再需要必填验证，但保留最大长度验证
        value: [
          { min: 1, max: 64, message: '权限值长度在 1 64 个字符之间', trigger: 'blur' }
        ],
        api: [
          { required: true, message: '请选择接口地址', trigger: 'change' }
        ],
        method: [
          { required: true, message: '请选择请求方法', trigger: 'change' }
        ]
      },
      // 新增：可用的按钮列表（从后端/buttons接口获取      availableButtons: [],
      // 新增：可用的API端点列表（从后端API获取      availableApis: []
    }
  },
  mounted() {
    // 从路由参数中获取菜单ID
    this.menuId = this.$route.query.menuId
    if (this.menuId) {
      this.fetchMenuInfo()
      this.fetchMenuButtons()
      // 新增：获取可用的按钮列表和API端点列表
      this.fetchAvailableButtons()
      this.fetchAvailableApis()
    } else {
      this.$message.error('未找到菜单ID')
    }
  },
  methods: {
    
    // 获取菜单信息
    async fetchMenuInfo() {
      try {
        const response = await getMenuDetail(this.menuId)
        this.menuInfo = response || {}
      } catch (error) {
        this.$message.error('获取菜单信息失败')
        console.error('获取菜单信息失败:', error)
      }
    },
    
    // 获取菜单按钮列表
    async fetchMenuButtons() {
      this.loading = true
      try {
        // 根据接口文档，后端返回的是直接的按钮列表数组
        const response = await getMenuButtonList({ menu_id: this.menuId })
        this.menuButtons = response.results || []
      } catch (error) {
        this.$message.error('获取按钮列表失败')
        console.error('获取按钮列表失败:', error)
        this.menuButtons = []
      } finally {
        this.loading = false
      }
    },
    
    // 新增：获取可用的按钮列表
    async fetchAvailableButtons() {
      try {
        // 使用新的API获取全量按钮列表，不再是分页数据
        const response = await getAllButtons()
        // 确保availableButtons始终是一个数组，防止null值导致的渲染错误
        this.availableButtons = Array.isArray(response) ? response : (response && Array.isArray(response.results) ? response.results : [])
      } catch (error) {
        this.$message.error('获取可用按钮列表失败')
        console.error('获取可用按钮列表失败:', error)
        // 发生错误时也确保availableButtons是数组
        this.availableButtons = []
      }
    },
    
    // 新增：获取可用的API端点列表
    async fetchAvailableApis() {
      try {
        // 调用后端新创建的API获取所有可用接        // 根据接口文档，后端返回的是直接的API端点列表数组
        const response = await getAllApiEndpoints()
                this.availableApis = response || []
              } catch (error) {
        this.$message.error('获取可用接口地址失败')
        console.error('获取可用接口地址失败:', error)
        this.availableApis = []
      }
    },
    
    // 打开添加按钮弹窗
    openAddDialog() {
      this.newButton = {
        menu_id: this.menuId,
        name: '',
        value: '',
        api: '',
        method: 0
      }
      if (this.$refs.addButtonForm) {
        this.$refs.addButtonForm.resetFields()
      }
      this.addDialogVisible = true
    },
    
    // 处理新增按钮名称选择变化，自动设置权限值
    handleButtonNameChange(buttonName) {
      // 根据按钮名称生成对应的权限值
      // 这里假设权限值是按钮名称的小写形式，用下划线连接
      // 实际应用中可以根据需要调整生成规则
      if (buttonName) {
        // 移除可能的空格，转换为小写，用下划线连接
        const permissionValue = buttonName.toLowerCase().replace(/\s+/g, '_')
        this.newButton.value = permissionValue
      } else {
        this.newButton.value = ''
      }
    },
      
    // 处理编辑按钮名称选择变化，自动设置权限值
    handleEditButtonNameChange(buttonName) {
      if (buttonName) {
        // 移除可能的空格，转换为小写，用下划线连接
        const permissionValue = buttonName.toLowerCase().replace(/\s+/g, '_')
        this.currentButton.value = permissionValue
      } else {
        this.currentButton.value = ''
      }
    },
    
    // 添加按钮
    async addButton() {
      if (this.$refs.addButtonForm) {
        this.$refs.addButtonForm.validate(async (valid) => {
          if (valid) {
            try {
              const buttonData = {
                menu: this.menuId,
                name: this.newButton.name,
                value: this.newButton.value,
                api: this.newButton.api,
                method: this.newButton.method
              }
              
                                          
              const response = await createMenuButton(buttonData)
              
              this.$message.success('添加成功')
              this.addDialogVisible = false
              this.fetchMenuButtons()
              
            } catch (error) {
              this.$message.error('添加失败: ' + (error.message || '未知错误'))
              console.error('添加按钮失败:', error)
            }
          }
        })
      }
    },
    
    // 打开编辑按钮弹窗
    async openEditDialog(button) {
      // 深拷贝按钮数据
      this.currentButton = JSON.parse(JSON.stringify(button))
      
      // 重置表单验证状态
      if (this.$refs.editButtonForm) {
        this.$nextTick(() => {
          if (this.$refs.editButtonForm) {
            this.$refs.editButtonForm.clearValidate()
          }
        })
      }
      this.editDialogVisible = true
    },
    
    // 更新按钮
    async updateButton() {
      if (this.$refs.editButtonForm) {
        this.$refs.editButtonForm.validate(async (valid) => {
          if (valid) {
            try {
              const buttonData = {
                menu: this.menuId,
                name: this.currentButton.name,
                value: this.currentButton.value,
                api: this.currentButton.api,
                method: this.currentButton.method
              }
              
              const response = await updateMenuButton(this.currentButton.id, buttonData)
              
              this.$message.success('更新成功')
              this.editDialogVisible = false
              this.fetchMenuButtons()
              
            } catch (error) {
              this.$message.error('更新失败: ' + (error.message || '未知错误'))
              console.error('更新按钮失败:', error)
            }
          }
        })
      }
    },
    
    // 删除按钮
    async handleDelete(buttonId) {
      try {
        await this.$confirm('确定要删除这个按钮吗？删除后将无法恢复！', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await deleteMenuButton(buttonId)
        
        this.$message.success('删除成功')
        this.fetchMenuButtons()
        
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
          console.error('删除按钮失败:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
.menu-button {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-area {
  margin-bottom: 20px;
}

/* 状态样*/
.status-enabled {
  color: #67c23a;
}

.status-disabled {
  color: #f56c6c;
}
</style>