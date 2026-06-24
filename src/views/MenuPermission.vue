<template>
  <div class="menu-permission-management">
    <h1>菜单权限管理</h1>
    
    <!-- 角色选择-->
    <el-card class="role-selector-container">
      <el-form :model="roleForm" :inline="true" style="margin: 10px 0;">
        <el-form-item label="选择角色">
          <el-select v-model="roleForm.role_id" placeholder="请选择角色" style="width: 200px;" @change="handleRoleChange">
            <el-option label="-- 请选择角色 --" :value="0"/>
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="savePermissions" :loading="saving" :disabled="!roleForm.role_id">保存权限</el-button>
          <el-button @click="refreshData" :loading="refreshing">刷新</el-button>
          <el-button type="warning" @click="refreshCache">刷新缓存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 权限配置区域 -->
    <el-card class="permission-container">
      <div class="permission-content">
        <!-- 左侧菜单-->
        <div class="menu-tree-section">
          <div class="section-title">菜单</div>
          <el-tree
            v-loading="loadingMenuTree"
            :data="menuTreeData"
            :props="treeProps"
            node-key="id"
            ref="menuTree"
            :default-expanded-keys="defaultExpandedKeys"
            @node-click="handleNodeClick"
            :check-strictly="false"
            show-checkbox
            @check-change="handleMenuCheckChange"
            :filter-node-method="filterNode"
          >
            <template #default="{ node, data }">
              <span class="menu-node-content">
                <el-icon v-if="getIconComponent(data.icon)">
                  <component :is="getIconComponent(data.icon)"/>
                </el-icon>
                <span>{{ node.label }}</span>
                <span v-if="data.type === 0" class="menu-type-tag directory">目录</span>
                <span v-else-if="data.type === 1" class="menu-type-tag menu">菜单</span>
              </span>
            </template>
          </el-tree>
        </div>
        
        <!-- 右侧按钮列表 -->
        <div class="button-list-section">
          <div class="section-title">
            <span>{{ currentMenu ? currentMenu.name + ' - 按钮列表' : '请选择菜单' }}</span>
            <el-input
              v-model="buttonSearchKeyword"
              placeholder="搜索按钮名称"
              clearable
              size="small"
              prefix-icon="Search"
              class="button-search-input"
            />
          </div>
          <div v-if="currentMenu" class="button-list">
            <el-checkbox-group v-model="currentMenuButtonIds" @change="handleButtonCheckChange">
              <div v-loading="loadingButtons" class="button-items">
                <el-checkbox
                  v-for="button in filteredButtons"
                  :key="button.id"
                  :label="button.id"
                  class="button-item"
                >
                  <div class="button-info">
                    <div class="button-name">{{ button.name }}</div>
                    <div class="button-details">
                      <span class="button-perm">{{ button.perms }}</span>
                      <span class="button-method" :class="getMethodClass(button.method)">{{ getMethodLabel(button.method) }}</span>
                    </div>
                  </div>
                </el-checkbox>
              </div>
            </el-checkbox-group>
            <div v-if="!filteredButtons.length && !loadingButtons" class="no-data">
              暂无按钮数据
            </div>
          </div>
          <div v-else class="no-menu-selected">
            请从左侧选择一个菜          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 提示信息 -->
    <el-alert title="权限说明" type="info" :closable="false" class="permission-tips">
      <ul>
        <li>1. 选择左侧菜单后，可以配置该菜单下的按钮权限</li>
        <li>2. 菜单权限和按钮权限是独立控制的，即拥有菜单权限不代表拥有其下所有按钮权限</li>
        <li>3. 配置完成后请点击"保存权限"按钮使配置生效</li>
      </ul>
    </el-alert>
  </div>
</template>

<script>
import { getMenuTree, getUserMenus } from '../api/menu'
import { getMenuButtonList } from '../api/menuButton'
import { getRoleList, getRolePermissions, updateRolePermissions, newUpdateRolePermissions } from '../api/role'

export default {
  data() {
    return {
      // 角色相关
      roleForm: {
        role_id: 0
      },
      roles: [],
      
      // 菜单相关
      menuTreeData: [],
      defaultExpandedKeys: [],
      currentMenu: null,
      loadingMenuTree: false,
      
      // 按钮相关
      allButtons: [], // 所有按钮列表
      currentMenuButtonIds: [], // 当前选中菜单的按钮ID
      buttonSearchKeyword: '',
      loadingButtons: false,
      
      // 权限数据
      rolePermissions: {
        menu_ids: [],
        button_ids: []
      },
      
      // 加载状态
      loading: false,
      saving: false,
      refreshing: false,
      
      // 树配置
      treeProps: {
        children: 'children',
        label: 'name'
      },
      
      // 图标列表
      iconList: ['Search', 'User', 'Home', 'Setting', 'Menu', 'Plus', 'Edit', 'Delete', 'Folder', 'File', 'View', 'Lock', 'Unlock']
    }
  },
  
  computed: {
    // 过滤后的按钮列表
    filteredButtons() {
      if (!this.currentMenu) return []
      
      let buttons = this.allButtons.filter(button => button.menu_id === this.currentMenu.id)
      
      if (this.buttonSearchKeyword) {
        const keyword = this.buttonSearchKeyword.toLowerCase()
        buttons = buttons.filter(button => 
          button.name.toLowerCase().includes(keyword) || 
          button.perms.toLowerCase().includes(keyword)
        )
      }
      
      return buttons
    }
  },
  
  async mounted() {
    await this.initData()
  },
  
  methods: {
    // 初始化数据
    async initData() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchRoles(),
          this.fetchMenuTree(),
          this.fetchAllButtons()
        ])
      } catch (error) {
        this.$message.error('初始化数据失败，请重试')
        console.error('初始化数据失败', error)
      } finally {
        this.loading = false
      }
    },
    
    // 刷新数据
    async refreshData() {
      this.refreshing = true
      try {
        await this.initData()
        
        // 如果已选择角色，重新加载角色权限
        if (this.roleForm.role_id) {
          await this.fetchRolePermissions(this.roleForm.role_id)
        }
        this.$message.success('刷新成功')
      } catch (error) {
        this.$message.error('刷新失败，请重试')
      } finally {
        this.refreshing = false
      }
    },
    
    // 刷新缓存
    async refreshCache() {
      this.loading = true
      try {
        // 重新获取所有数据并带上刷新缓存参数
        await Promise.all([
          this.fetchRoles(true),
          this.fetchMenuTree(true),
          this.fetchAllButtons(true)
        ])
        
        // 如果已选择角色，重新加载角色权限
        if (this.roleForm.role_id) {
          await this.fetchRolePermissions(this.roleForm.role_id, true)
        }
        
        this.$message.success('缓存刷新成功')
      } catch (error) {
        this.$message.error('缓存刷新失败')
        console.error('刷新缓存失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    // 获取图标组件
    getIconComponent(icon) {
      if (!icon) return null
      return this.iconList.includes(icon) ? icon : null
    },
    
    // 过滤菜单节点
    filterNode(value, data) {
      if (!value) return true
      return data.name.toLowerCase().includes(value.toLowerCase())
    },
    
    // 获取请求方法标签
    getMethodLabel(method) {
      const methods = ['GET', 'POST', 'PUT', 'DELETE']
      return methods[method] || '未知'
    },
    
    // 获取请求方法样式
    getMethodClass(method) {
      const methodClasses = ['method-get', 'method-post', 'method-put', 'method-delete']
      return methodClasses[method] || ''
    },
    
    // 获取角色列表
    async fetchRoles(refresh = false) {
      try {
        const params = refresh ? { refresh_cache: true } : {}
        const response = await getRoleList(params)
        // 接口文档规范：getRoleList接口返回值直接使用，响应结构已经在API层处理
        this.roles = response.results || []
      } catch (error) {
        console.error('获取角色列表失败:', error)
      }
    },
    
    // 获取菜单
    async fetchMenuTree(refresh = false) {
      this.loadingMenuTree = true
      try {
        const params = refresh ? { refresh_cache: true } : {}
        // 注意：getMenuTree返回的是response.data
        const menuData = await getMenuTree(params)
        // 转换数据格式，确保树形结构正确
        this.menuTreeData = this.transformMenuTree(menuData)
        // 默认展开前两层
        // this.setDefaultExpandedKeys(this.menuTreeData)
      } catch (error) {
        console.error('获取菜单树失败', error)
        this.menuTreeData = []
      } finally {
        this.loadingMenuTree = false
      }
    },
    
    // 设置默认展开的节点
    setDefaultExpandedKeys(treeData, level = 0) {
      if (level >= 2) return
      
      treeData.forEach(node => {
        this.defaultExpandedKeys.push(node.id)
        if (node.children && node.children.length) {
          this.setDefaultExpandedKeys(node.children, level + 1)
        }
      })
    },
    
    // 转换菜单树数据格式
    
    transformMenuTree(menuData) {
      // 确保返回的是数组
      if (!Array.isArray(menuData)) {
        return []
      }
      
      // 构建父子关系
      const menuMap = {}
      const roots = []
      
      // 首先将所有菜单放入map
      menuData.forEach(menu => {
        menuMap[menu.id] = { ...menu, children: [] }
      })
      
      // 构建树结构
      menuData.forEach(menu => {
        if (menu.parent_id === 0 || !menuMap[menu.parent_id]) {
          roots.push(menuMap[menu.id])
        } else {
          menuMap[menu.parent_id].children.push(menuMap[menu.id])
        }
      })
      
      return roots
    },
    
    // 获取所有按钮列表
    async fetchAllButtons(refresh = false) {
      this.loadingButtons = true
      try {
        const params = refresh ? { refresh_cache: true } : {}
        const response = await getMenuButtonList(params)
        // 接口文档规范：getMenuButtonList接口返回值直接使用，响应结构已经在API层处理
        this.allButtons = response.results || []
      } catch (error) {
        console.error('获取按钮列表失败:', error)
        this.allButtons = []
      } finally {
        this.loadingButtons = false
      }
    },
    
    // 处理角色选择变化
    async handleRoleChange(roleId) {
      if (roleId) {
        await this.fetchRolePermissions(roleId)
      } else {
        this.resetPermissions()
      }
    },
    
    // 获取角色权限
    async fetchRolePermissions(roleId, refresh = false) {
      this.loading = true
      try {
        const params = refresh ? { refresh_cache: true } : {}
        const response = await getRolePermissions(roleId, params)
        // 保存角色权限数据
        // 接口文档规范：getRolePermissions接口返回值直接使用，响应结构已经在API层处理
        this.rolePermissions = response.results || { menu_ids: [], button_ids: [] }
        
        // 更新选中的菜单ID，使用setCheckedKeys方法
        this.$nextTick(() => {
          if (this.$refs.menuTree && this.$refs.menuTree.setCheckedKeys) {
            this.$refs.menuTree.setCheckedKeys(this.rolePermissions.menu_ids)
          }
        })
        
        // 权限加载完成后，如果有选中的菜单，更新其按钮选中状态
        if (this.currentMenu) {
          // 获取该菜单下所有按钮ID
          const menuButtonIds = this.allButtons
            .filter(button => button.menu_id === this.currentMenu.id)
            .map(button => button.id)
          
          // 筛选出已选中的按钮ID
          const selectedButtonIds = menuButtonIds.filter(
            buttonId => this.rolePermissions.button_ids.includes(buttonId)
          )
          
          // 更新当前菜单的按钮选中状态
          this.currentMenuButtonIds = [...selectedButtonIds]
        }
      } catch (error) {
        console.error('获取角色权限失败:', error)
        this.resetPermissions()
      } finally {
        this.loading = false
      }
    },
    
    // 重置权限数据
    resetPermissions() {
      this.rolePermissions = { menu_ids: [], button_ids: [] }
      this.currentMenuButtonIds = []
      
      // 重置菜单树选中状态
      this.$nextTick(() => {
        if (this.$refs.menuTree && this.$refs.menuTree.setCheckedKeys) {
          this.$refs.menuTree.setCheckedKeys([])
        }
      })
    },
    
    // 处理菜单节点点击
    handleNodeClick(data) {
      if (data.type === 2) return // 不处理按钮类型
            
      this.currentMenu = data
      
      // 获取该菜单下所有按钮ID
      const menuButtonIds = this.allButtons
        .filter(button => button.menu_id === data.id)
        .map(button => button.id)
      
      // 筛选出已选中的按钮ID
      const selectedButtonIds = menuButtonIds.filter(
        buttonId => this.rolePermissions.button_ids.includes(buttonId)
      )
      
      // 更新当前菜单的按钮选中状态
      this.currentMenuButtonIds = [...selectedButtonIds]
      
          },
    

    
    // 处理菜单选中变化
    handleMenuCheckChange(menuId, checked) {
            
      if (checked) {
        // 菜单被选中
        // 1. 添加菜单ID到menu_ids数组（去重）
        if (!this.rolePermissions.menu_ids.includes(menuId)) {
          this.rolePermissions.menu_ids.push(menuId)
        }
        
        // 2. 获取该菜单下所有按钮ID
        const menuButtonIds = this.allButtons
          .filter(button => button.menu_id === menuId)
          .map(button => button.id)
        
        // 3. 添加所有按钮权限（去重）
        menuButtonIds.forEach(buttonId => {
          if (!this.rolePermissions.button_ids.includes(buttonId)) {
            this.rolePermissions.button_ids.push(buttonId)
          }
        })
        
        // 4. 如果当前正在查看这个菜单，更新按钮选中状态
        if (this.currentMenu && this.currentMenu.id === menuId) {
          this.currentMenuButtonIds = menuButtonIds
        }
      } else {
        // 菜单取消选中
        // 1. 从menu_ids数组中移除
        const menuIndex = this.rolePermissions.menu_ids.indexOf(menuId)
        if (menuIndex !== -1) {
          this.rolePermissions.menu_ids.splice(menuIndex, 1)
        }
        
        // 2. 获取该菜单下所有按钮ID
        const menuButtonIds = this.allButtons
          .filter(button => button.menu_id === menuId)
          .map(button => button.id)
        
        // 3. 移除所有按钮权限
        menuButtonIds.forEach(buttonId => {
          const buttonIndex = this.rolePermissions.button_ids.indexOf(buttonId)
          if (buttonIndex !== -1) {
            this.rolePermissions.button_ids.splice(buttonIndex, 1)
          }
        })
        
        // 4. 如果当前正在查看这个菜单，清空按钮选中状态
        if (this.currentMenu && this.currentMenu.id === menuId) {
          this.currentMenuButtonIds = []
        }
      }
    },
    
    // 处理按钮选中变化
    handleButtonCheckChange(checkedButtonIds) {
            
      if (!this.currentMenu) {
        console.error('没有选中的菜单')
        return
      }
      
      const menuId = this.currentMenu.id
      
      // 1. 更新currentMenuButtonIds
      this.currentMenuButtonIds = [...checkedButtonIds]
      
      // 2. 获取当前菜单的所有按钮ID
      const menuButtonIds = this.allButtons
        .filter(button => button.menu_id === menuId)
        .map(button => button.id)
      
      // 3. 更新rolePermissions.button_ids数组
      // 移除当前菜单的所有按钮权限
      this.rolePermissions.button_ids = this.rolePermissions.button_ids.filter(
        buttonId => !menuButtonIds.includes(buttonId)
      )
      // 添加新选中的按钮权限
      checkedButtonIds.forEach(buttonId => {
        if (!this.rolePermissions.button_ids.includes(buttonId)) {
          this.rolePermissions.button_ids.push(buttonId)
        }
      })
      
      // 4. 实现反向联动：按钮状态影响菜单选中状态
      const hasCheckedButtons = checkedButtonIds.length > 0
      
      if (hasCheckedButtons) {
        // 有按钮被选中，自动选中对应的菜单
        this.handleMenuSelectionChange(this.selectedMenuId, true)        
        if (!this.rolePermissions.menu_ids.includes(menuId)) {
                    this.rolePermissions.menu_ids.push(menuId)
          
          // 直接更新菜单树选中状态，使用第三个参数false避免触发check-change事件
          try {
            if (this.$refs.menuTree) {
              this.$refs.menuTree.setChecked(menuId, true, false)
            }
          } catch (error) {
            console.error('更新菜单树选中状态失败', error)
          }
        }
      } else {
        // 所有按钮都未被选中，自动取消选中对应的菜单
        if (this.rolePermissions.menu_ids.includes(menuId)) {
                    const menuIndex = this.rolePermissions.menu_ids.indexOf(menuId)
          if (menuIndex !== -1) {
            this.rolePermissions.menu_ids.splice(menuIndex, 1)
          }
          
          // 直接更新菜单树选中状态，使用第三个参数false避免触发check-change事件
          try {
            if (this.$refs.menuTree) {
              this.$refs.menuTree.setChecked(menuId, false, false)
            }
          } catch (error) {
            console.error('更新菜单树选中状态失败', error)
          }
        }
      }
    },
    
    // 保存权限配置
    async savePermissions() {
      if (!this.roleForm.role_id) {
        this.$message.warning('请先选择一个角色')
        return
      }
      
      this.saving = true
      try {
        // 使用newUpdateRolePermissions API来保存权限
        await newUpdateRolePermissions(this.roleForm.role_id, this.rolePermissions.menu_ids, this.rolePermissions.button_ids)
        this.$message.success('保存成功')
      } catch (error) {
        console.error('保存权限失败:', error)
        this.$message.error('保存失败，请重试')
      } finally {
        this.saving = false
      }
    },
  }
}
</script>

<style scoped>
.menu-permission-management {
  padding: 20px;
}

.role-selector-container {
  margin-bottom: 20px;
}

.permission-container {
  margin-bottom: 20px;
}

.permission-content {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.menu-tree-section {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.button-list-section {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-title {
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-type-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
}

.menu-type-tag.directory {
  background-color: #e6f7ff;
  color: #1890ff;
}

.menu-type-tag.menu {
  background-color: #f6ffed;
  color: #52c41a;
}

.button-search-input {
  width: 200px;
}

.button-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.button-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.button-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  transition: all 0.3s;
  cursor: pointer;
}

.button-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.button-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.button-name {
  font-weight: 500;
}

.button-details {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.button-perm {
  color: #909399;
}

.button-method {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
}

.method-get {
  background-color: #e6f7ff;
  color: #1890ff;
}

.method-post {
  background-color: #f6ffed;
  color: #52c41a;
}

.method-put {
  background-color: #fff7e6;
  color: #fa8c16;
}

.method-delete {
  background-color: #fff1f0;
  color: #f5222d;
}

.no-data,
.no-menu-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
}

.permission-tips {
  margin-top: 10px;
}

.permission-tips ul {
  margin: 0;
  padding-left: 20px;
}

.permission-tips li {
  margin: 4px 0;
}
</style>