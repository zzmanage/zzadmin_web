<template>
  <div>
    <h1>菜单管理</h1>
    
    <!-- 查询条件区域 -->
    <SearchForm
      :form-data="queryForm"
      :form-items="searchFields"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #extra-buttons>
        <el-button type="primary" @click="handleAdd">添加菜单</el-button>
        <el-button @click="refreshMenuCache">刷新缓存</el-button>
      </template>
    </SearchForm>
    

    <!-- 菜单列表 -->
    <div class="menu-list-container">
      <TreeTable
        ref="treeTable"
        :data="menuTreeData"
        :columns="tableColumns"
        :loading="loading"
        row-key="id"
        :tree-props="treeProps"
        :indent-width="20"
        border
        :default-expand-all="false"

        @row-action="handleRowAction"
        @expand-change="handleExpandChange"
      >
        <!-- 图标列的自定义渲-->
        <template #column-icon="{ row }">
          <el-icon v-if="row.icon" class="menu-icon">
            <component :is="row.icon" />
          </el-icon>
          <span v-else class="empty-icon">-</span>
        </template>
        
        <!-- 状态字段的自定义渲- 使用开关组-->
        <template #column-status="{ row }">
          <el-switch 
            v-model="row.status" 
            active-color="#13ce66" 
            inactive-color="#ff4949" 
            disabled
            :active-text="'启用'"
            :inactive-text="'禁用'"
          />
        </template>
        
        <!-- 布尔值字段的自定义渲- 使用开关组-->
        <template #column-visible="{ row }">
          <el-switch 
            v-model="row.visible" 
            active-color="#13ce66" 
            inactive-color="#dcdfe6" 
            disabled
            :active-text="'显示'"
            :inactive-text="'隐藏'"
          />
        </template>
        
        <template #column-cache="{ row }">
          <el-switch 
            v-model="row.cache" 
            active-color="#13ce66" 
            inactive-color="#dcdfe6" 
            disabled
            :active-text="row.cache ? '启用' : '禁用'"
            :inactive-text="row.cache ? '启用' : '禁用'"
          />
        </template>
      </TreeTable>
    </div>
    
    <!-- 添加/编辑菜单弹窗 -->
    <DialogForm
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-items="formFields"
      :form-data="formData"
      :rules="rules"
      @submit="handleSave"
      @cancel="handleCancel"
      @handleCatalogChange="handleCatalogChange"
      @selectIcon="selectIcon"
    />
  </div>
</template>

<script>
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '../api/menu'
import SearchForm from '../components/SearchForm.vue'
import BatchActions from '../components/BatchActions.vue'
import TreeTable from '../components/TreeTable.vue'
import DialogForm from '../components/DialogForm.vue'

// 图标列表
const iconList = ['Search', 'User', 'HomeFilled', 'Setting', 'Menu', 'Plus', 'Edit', 'Delete', 'Folder', 'Files', 'View', 'Lock', 'Unlock', 'Check', 'Close', 'Refresh', 'Download', 'Upload', 'ZoomIn', 'ZoomOut', 'Filter', 'Sort', 'More', 'Help', 'Info', 'Warning', 'Success', 'Danger']

export default {
  name: 'MenuManagement',
  components: {
    SearchForm,
    BatchActions,
    TreeTable,
    DialogForm
  },
  data() {
    return {
      // CRUD相关
      // crudData: useCRUD(),
      // 菜单数据
      menuTreeData: [],
      // 查询表单
      queryForm: {
        name: '',
        is_catalog: -1
      },
      // 加载状      loading: false,
      // 弹窗状      dialogVisible: false,
      dialogTitle: '',
      dialogType: 'add', // 'add' or 'edit'
      // 表单数据
      formData: {
        parent_id: [],
        name: '',
        is_catalog: false,
        is_link: false,
        web_path: '',
        component: '',
        component_name: '',
        icon: '',
        sort: 0,
        status: true,
        visible: true,
        cache: false
      },
      // 选中的图      selectedIcon: '',
      // 图标列表
      iconList: iconList,
      // 查询字段配置
      searchFields: [
        {
          label: '菜单名称',
          prop: 'name',
          type: 'input',
          placeholder: '请输入菜单名称',
          width: 200
        },
        {
          label: '是否目录',
          prop: 'is_catalog',
          type: 'select',
          placeholder: '请选择是否目录',
          width: 120,
          options: [
            { label: '全部', value: -1 },
            { label: '是', value: true },
            { label: '否', value: false }
          ]
        }
      ],
      // 操作按钮配置
      actionButtons: [
        {
          label: '新增菜单',
          type: 'primary',
          onClick: this.handleAdd
        }
      ],
      // 表格列配置
      tableColumns: [
        {
          prop: 'id',
          label: 'ID',
          width: 80,
          type: 'index'
        },
        {
          prop: 'name',
          label: '菜单名称',
          minWidth: 180,
          isTreeColumn: true
        },
        {
          prop: 'is_catalog',
          label: '类型',
          width: 100,
          tag: true,
          tagType: row => row.is_catalog ? 'primary' : 'success',
          formatter: row => row.is_catalog ? '目录' : '菜单'
        },
        {
          prop: 'web_path',
          label: '路由路径',
          minWidth: 180
        },
        {
          prop: 'component',
          label: '组件路径',
          minWidth: 180
        },
        {
          prop: 'component_name',
          label: '组件名称',
          minWidth: 180
        },
        {
          prop: 'icon',
          label: '图标',
          width: 100,
          template: true
        },
        {
          prop: 'is_link',
          label: '是否外链',
          width: 100,
          formatter: row => row.is_link ? '是' : '否',
          tag: true,
          tagType: row => row.is_link ? 'warning' : 'default'
        },
        {
          prop: 'sort',
          label: '排序',
          width: 80
        },
        {
          prop: 'status',
          label: '状态',
          width: 120,
          template: true
        },
        {
          prop: 'visible',
          label: '是否显示',
          width: 120,
          template: true
        },
        {
          prop: 'cache',
          label: '是否缓存',
          width: 120,
          template: true
        },
        {
          label: '操作',
          width: 350,
          fixed: 'right',
          align: 'center',
          showOverflowTooltip: false,
          actions: [
            { text: '添加子菜单', action: 'handleAddSubmenu', type: 'primary', hidden: row => row.is_catalog !== true, size: 'small' },
            { text: '编辑', action: 'handleEdit', size: 'small' },
            { text: '按钮配置', action: 'openMenuButtonManagement', hidden: row => row.is_catalog === true, size: 'small' },
            { text: '删除', action: 'handleDelete', type: 'danger', size: 'small' }
          ]
        }
      ],
      // 表单字段配置
      formFields: [
        {
          label: '上级菜单',
          prop: 'parent_id',
          type: 'cascader',
          placeholder: '请选择上级菜单',
          options: [],
          props: {
            checkStrictly: true,
            value: 'id',
            label: 'name',
            children: 'children'
          },
          on: {
            change: 'handleParentChange'
          }
        },
        {
          label: '菜单名称',
          prop: 'name',
          type: 'input',
          placeholder: '请输入菜单名称'
        },
        {
          label: '是否目录',
          prop: 'is_catalog',
          type: 'switch',
          activeText: '是',
          inactiveText: '否',
          activeColor: '#13ce66',
          inactiveColor: '#dcdfe6',
          onChange: this.handleCatalogChange
        },
        {
          label: '是否外链',
          prop: 'is_link',
          type: 'switch',
          activeText: '是',
          inactiveText: '否',
          activeColor: '#13ce66',
          inactiveColor: '#dcdfe6'
        },
        {
          label: '路由路径',
          prop: 'web_path',
          type: 'input',
          placeholder: '请输入路由路径'
        },
        {
          label: '组件路径',
          prop: 'component',
          type: 'input',
          placeholder: '请输入组件路径',
          condition: formData => !formData.is_catalog
        },
        {
          label: '组件名称',
          prop: 'component_name',
          type: 'input',
          placeholder: '请输入组件名称',
          condition: formData => !formData.is_catalog
        },
        {
          label: '图标',
          prop: 'icon',
          type: 'icon',
          placeholder: '选择图标',
          iconList: iconList
        },
        { label: '排序', prop: 'sort', type: 'number', required: true, min: 1, placeholder: '请输入排序号' },
        {
          label: '状态',
          prop: 'status',
          type: 'switch',
          activeText: '启用',
          inactiveText: '禁用',
          activeColor: '#13ce66',
          inactiveColor: '#ff4949'
        },
        {
          label: '是否显示',
          prop: 'visible',
          type: 'switch',
          activeText: '显示',
          inactiveText: '隐藏',
          activeColor: '#13ce66',
          inactiveColor: '#dcdfe6'
        },
        {
          label: '是否缓存',
          prop: 'cache',
          type: 'switch',
          activeText: '是',
          inactiveText: '否',
          activeColor: '#13ce66',
          inactiveColor: '#dcdfe6'
        }
      ],
      // 树形表格配置
      treeProps: {
        children: 'children'
      },
      // 表单验证规则
      rules: {
        name: [
          { required: true, message: '请输入菜单名称', trigger: 'blur' },
          { min: 1, max: 20, message: '菜单名称长度在 1 到 20 个字符之间', trigger: 'blur' }
        ],
        is_catalog: [
          { required: true, message: '请选择是否目录', trigger: 'change' }
        ],
        is_link: [
          { required: true, message: '请选择是否外链', trigger: 'change' }
        ],
        web_path: [
          { required: false, message: '请输入路由路径', trigger: 'blur' }
        ],
        component: [
          {
            required: (rule, value, callback) => {
              // 添加菜单时使用formData，编辑时也使用formData
              const isCatalog = this.formData.is_catalog
              // 只有非目录菜单才需要组件路径
              if (!isCatalog && !value) {
                callback(new Error('请输入组件路径'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        component_name: [
          {
            required: (rule, value, callback) => {
              // 添加菜单时使用formData，编辑时也使用formData
              const isCatalog = this.formData.is_catalog
              // 只有非目录菜单才需要组件名称
              if (!isCatalog && !value) {
                callback(new Error('请输入组件名称'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        sort: [
          { required: true, message: '请输入排序号', trigger: 'blur' },
          { type: 'number', min: 1, message: '排序必须为正整数', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        visible: [
          { required: true, message: '请选择是否显示', trigger: 'change' }
        ],
        cache: [
          { required: true, message: '请选择是否缓存', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.fetchMenuTree()
  },
  methods: {
    // 获取图标组件
    getIconComponent(icon) {
      if (!icon) return '-'
      // 直接返回图标名称
      return icon
    },
    
    // 搜索图标
    searchIcons(keyword) {
      if (!keyword) return this.iconList
      return this.iconList.filter(icon => icon.toLowerCase().includes(keyword.toLowerCase()))
    },
    
    // 获取菜单树
    async fetchMenuTree(refreshCache = false, searchParams = {}) {
      this.loading = true
      try {
        const params = {
          ...searchParams,
          ...(refreshCache ? { refresh_cache: 'true' } : {})
        }
        // 注意：getMenuTree返回的是response.data
        const menuData = await getMenuTree(params)
        // 正确处理返回的数据格式并确保children字段存在
        this.menuTreeData = Array.isArray(menuData)  
          ? this.normalizeMenuData(menuData) 
          : [{ id: 0, name: '顶级菜单', children: [] }]
        // 更新级联选择器的选项
        this.formFields.forEach(field => {
          if (field.prop === 'parent_id') {
            field.options = this.menuTreeData
          }
        })
      } catch (error) {
        this.$message.error('获取菜单树失败，请联系管理员')
        console.error('获取菜单树失败', error)
        this.menuTreeData = [
          { id: 0, name: '顶级菜单', children: [] }
        ]
        // 更新级联选择器的选项
        this.formFields.forEach(field => {
          if (field.prop === 'parent_id') {
            field.options = this.menuTreeData
          }
        })
      } finally {
        this.loading = false
      }
    },
    
    // 规范化菜单数据，确保children字段存在
    normalizeMenuData(menuData) {
      if (!Array.isArray(menuData)) return []
      
      return menuData.map(item => {
        const normalizedItem = { ...item }
        // 确保有children数组字段
        if (!Array.isArray(normalizedItem.children)) {
          normalizedItem.children = []
        } else if (normalizedItem.children.length > 0) {
          // 递归处理子菜单
          normalizedItem.children = this.normalizeMenuData(normalizedItem.children)
        }
        return normalizedItem
      })
    },
    
    // 搜索
    async handleSearch() {
      await this.fetchMenuTree(false, this.queryForm)
    },
    
    // 重置查询
    async handleReset() {
      this.queryForm = {
        name: '',
        is_catalog: -1
      }
      await this.fetchMenuTree()
    },
    
    // 刷新菜单缓存
    refreshMenuCache() {
      this.$confirm('确定要刷新菜单缓存吗？这将获取最新的菜单数据', '确认刷新', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        await this.fetchMenuTree(true)
        this.$message.success('菜单缓存刷新成功')
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    // 打开添加菜单弹窗
    handleAdd() {
      this.dialogType = 'add'
      this.dialogTitle = '添加菜单'
      this.formData = {
        parent_id: [],
        name: '',
        is_catalog: false,
        is_link: false,
        web_path: '',
        component: '',
        component_name: '',
        icon: '',
        sort: 1,
        status: true,
        visible: true,
        cache: false
      }
      this.selectedIcon = ''
      this.dialogVisible = true
    },
    
    // 添加子菜单
    handleAddSubmenu(row) {
      this.dialogType = 'add'
      this.dialogTitle = '添加子菜单'
      this.formData = {
        parent_id: [row.id],
        name: '',
        is_catalog: false,
        is_link: false,
        web_path: '',
        component: '',
        component_name: '',
        icon: '',
        sort: 1,
        status: true,
        visible: true,
        cache: false
      }
      this.selectedIcon = ''
      this.dialogVisible = true
    },
    
    // 打开编辑菜单弹窗
    async handleEdit(row) {
      // 先获取最新的菜单树数据，确保有完整的菜单层次结构
      await this.fetchMenuTree()
      // 深拷贝菜单数据，避免直接修改原始数据
      this.formData = JSON.parse(JSON.stringify(row))
      
                  
      // 确保parent_id是数组格式
      if (this.formData.parent_id !== undefined && this.formData.parent_id !== null) {
        if (!Array.isArray(this.formData.parent_id)) {
          if (this.formData.parent_id === 0 || this.formData.parent_id === '0') {
            this.formData.parent_id = [] // 顶级菜单
          } else {
            this.formData.parent_id = [this.formData.parent_id]
          }
        }
      } else {
        this.formData.parent_id = []
      }
      
      // 确保布尔类型字段正确
      if (this.formData.status !== undefined) {
        // 如果是数值或字符串，转换为布尔
        if (typeof this.formData.status === 'number') {
          this.formData.status = this.formData.status !== 0
        } else if (typeof this.formData.status === 'string') {
          this.formData.status = this.formData.status.toLowerCase() === 'true' || this.formData.status === '1'
        }
      } else {
        this.formData.status = true // 默认启用
      }
      
      // 确保其他布尔字段正确
      ['visible', 'cache', 'is_catalog', 'is_link'].forEach(field => {
        if (this.formData[field] !== undefined) {
          if (typeof this.formData[field] === 'number') {
            this.formData[field] = this.formData[field] !== 0
          } else if (typeof this.formData[field] === 'string') {
            this.formData[field] = this.formData[field].toLowerCase() === 'true' || this.formData[field] === '1'
          }
        } else {
          this.formData[field] = false // 默认false
        }
      })
      
      // 确保其他字段有默认值
      this.formData.sort = this.formData.sort || 1
      this.formData.web_path = this.formData.web_path || ''
      this.formData.component = this.formData.component || ''
      this.formData.component_name = this.formData.component_name || ''
      
      this.selectedIcon = this.formData.icon || ''
      this.dialogType = 'edit'
      this.dialogTitle = '编辑菜单'
      this.dialogVisible = true
    },
    
    // 选择图标
    selectIcon(icon) {
      this.formData.icon = icon
      this.selectedIcon = icon
    },
    
    // 处理是否目录变化
    handleCatalogChange() {
      if (this.formData.is_catalog) {
        // 如果是目录，清除组件相关字段
        this.formData.component = ''
        this.formData.component_name = ''
      }
    },
    
    // 处理父菜单变化
    handleParentChange(value) {
      // 确保父菜单ID正确设置
      if (value && value.length > 0) {
        // 级联选择器返回的是数组，这里不需要特殊处理
      } else {
        this.formData.parent_id = []
      }
    },
    
    // 保存菜单
    async handleSave() {
      try {
        // 修复parent_id处理逻辑，确保顶级菜单传0
        const parentId = this.formData.parent_id && this.formData.parent_id.length > 0 
          ? this.formData.parent_id[this.formData.parent_id.length - 1] 
          : 0
        
        // 确保布尔类型字段正确转换
        const menuData = {
          parent_id: parentId,
          name: this.formData.name,
          is_catalog: Boolean(this.formData.is_catalog),
          is_link: Boolean(this.formData.is_link),
          web_path: this.formData.web_path || '',
          component: this.formData.component || '',
          component_name: this.formData.component_name || '',
          icon: this.formData.icon || '',
          sort: parseInt(this.formData.sort) || 0,
          status: Boolean(this.formData.status),
          visible: Boolean(this.formData.visible),
          cache: Boolean(this.formData.cache)
        }

                
        if (this.dialogType === 'add') {
          // 发送请求到后端创建菜单
          await createMenu(menuData)
          this.$message.success('添加成功')
        } else {
          // 发送请求到后端更新菜单
          await updateMenu(this.formData.id, menuData)
          this.$message.success('更新成功')
        }
        
        this.dialogVisible = false
        this.fetchMenuTree()
        
      } catch (error) {
        this.$message.error('操作失败: ' + (error.message || '未知错误'))
        console.error('操作菜单失败:', error)
      }
    },
    
    // 取消操作
    handleCancel() {
      this.dialogVisible = false
    },
    
    // 删除菜单
    async handleDelete(row) {
      this.$confirm('确定要删除这个菜单吗？删除后将无法恢复！', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteMenu(row.id)
          this.$message.success('删除成功')
          this.fetchMenuTree()
        } catch (error) {
          console.error('删除菜单失败:', error)
          this.$message.error('删除失败')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    // 打开按钮配置页面
    openMenuButtonManagement(row) {
      this.$router.push({
        name: 'MenuButton',
        query: { menuId: row.id }
      })
    },
    
    // 处理行操作
    handleRowAction({ action, row }) {
      if (action === 'handleAddSubmenu' && row.is_catalog === true) {
        this.handleAddSubmenu(row)
      } else if (action === 'handleEdit') {
        this.handleEdit(row)
      } else if (action === 'openMenuButtonManagement' && row.is_catalog === false) {
        this.openMenuButtonManagement(row)
      } else if (action === 'handleDelete') {
        this.handleDelete(row)
      }
    },
    
    // 处理节点展开/收起事件
    handleExpandChange(row, expanded) {
    },
    
    // 展开所有节点
    expandAll() {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.expandAll()
      }
    },
    
    // 收起所有节点
    collapseAll() {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.collapseAll()
      }
    }
  }
}
</script>

<style scoped>
.menu-list-container {
  margin-top: 20px;
}

.menu-icon {
  font-size: 18px;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: #ecf5ff;
}

.empty-icon {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #c0c4cc;
}

/* 树形表格样式优化 */
.el-table .el-table__row .el-tree-node__content {
  padding: 6px 0;
}

.el-table .el-tree-node__expand-icon {
  margin-right: 8px;
}

/* 开关组件样式优*/
.el-table .el-switch {
  --el-switch-on-color: #13ce66;
  --el-switch-off-color: #dcdfe6;
  --el-switch-border-color: transparent;
}

.el-table .el-switch .el-switch__label {
  font-size: 12px;
  height: 20px;
  line-height: 20px;
  min-width: 30px;
}

/* 操作列按钮样式统一 */
.el-table .el-button {
  padding: 6px 12px;
  font-size: 12px;
}

/* 提升表格行高，改善显示效*/
.el-table .el-table__row {
  height: 48px;
}

.el-table .el-table__cell {
  padding: 12px 0;
}

/* 优化表头样式 */
.el-table .el-table__header th {
  background-color: #fafafa;
  font-weight: 500;
}

/* 鼠标悬停效果 */
.el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: #f5f7fa;
}

/* 状态样*/
.status-enabled {
  color: #67c23a;
}

.status-disabled {
  color: #f56c6c;
}

.visible-enabled {
  color: #409eff;
}

.visible-disabled {
  color: #909399;
}

.icon-selector-wrapper {
  padding: 10px;
}

.icon-search-input {
  margin-bottom: 10px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 5px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  text-align: center;
}

.icon-item:hover {
  background-color: #f0f0f0;
  transform: translateY(-1px);
}

.icon-item.selected {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.icon-name {
  font-size: 11px;
  margin-top: 3px;
  color: #666;
  word-break: break-all;
}

.icon-select-wrapper {
  align-items: center;
  cursor: pointer;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 32px;
  transition: border-color 0.2s;
}

.icon-select-wrapper:hover {
  border-color: #c0c4cc;
}

.selected-icon {
  display: flex;
  align-items: center;
}

.selected-icon span {
  margin-left: 5px;
  color: #909399;
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.menu-table .el-button {
  margin-right: 5px;
}
</style>

