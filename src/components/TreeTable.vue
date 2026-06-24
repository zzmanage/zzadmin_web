<template>
  <div class="tree-table-container">
    <el-table
      ref="treeTable"
      v-loading="loading"
      :data="processedData"
      :border="border"
      :height="height"
      :max-height="maxHeight"
      :stripe="stripe"
      :row-key="rowKey"
      :default-sort="defaultSort"
      :tooltip-effect="tooltipEffect"
      :header-cell-style="headerCellStyle"
      :cell-style="cellStyle"
      :row-class-name="rowClassName"
      :scroll-x="scrollX"
      :scroll-y="scrollY"
      :select-on-indeterminate="selectOnIndeterminate"
      :align="align"
      :empty-text="emptyText"
      :table-layout="tableLayout"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      @cell-click="handleCellClick"
      @row-click="handleRowClick"
      @header-click="handleHeaderClick"
      @current-change="handleCurrentChange"
      @header-contextmenu="handleHeaderContextmenu"
      @row-contextmenu="handleRowContextmenu"
    >
      <!-- 复选框 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        :width="selectionWidth || 55"
        :reserve-selection="reserveSelection"
        :selectable="selectable"
      />
      
      <!-- 展开-->
      <el-table-column
        v-if="showExpand"
        type="expand"
        :width="expandWidth || 55"
      >
        <template #default="scope">
          <slot name="expand" :row="scope.row" ></slot>
        </template>
      </el-table-column>
      
      <!-- 自定义列 -->
      <template v-for="(column, index) in columns" :key="index">
        <el-table-column
          v-if="!column.hidden || column.hidden === false"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :sort-by="column.sortBy"
          :sort-method="column.sortMethod"
          :resizable="column.resizable !== false"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
          :align="column.align || align"
          :header-align="column.headerAlign || align"
          :filterable="column.filterable"
          :filters="column.filters"
          :filter-method="column.filterMethod"
          :filter-multiple="column.filterMultiple !== false"
          :formatter="column.formatter"
          :selectable="column.selectable"
          :scoped-slot="column.scopedSlot"
        >
          <!-- 自定义列模板 -->
          <template v-if="column.template" #default="scope">
            <slot :name="`column-${column.prop}`" :row="scope.row" :column="column" ></slot>
          </template>
          <!-- actions配置处理 -->
          <template v-else-if="column.actions && column.actions.length > 0" #default="scope">
            <template v-for="(action, actionIndex) in column.actions" :key="actionIndex">
              <el-button
                v-if="action && (!action.hidden || (typeof action.hidden === 'function' ? !action.hidden(scope.row) : true))"
                :type="action.type || 'default'"
                :size="action.size || 'small'"
                :icon="action.icon"
                :disabled="typeof action.disabled === 'function' ? action.disabled(scope.row) : (action.disabled || false)"
                @click.stop="handleActionClick(action, scope.row)"
                style="margin-right: 5px"
              >
                {{ action.text }}
              </el-button>
            </template>
          </template>
          <!-- 树形结构的缩进样式 -->
          <template v-else-if="column.isTreeColumn" #default="scope">
            <div style="display: flex; align-items: center;">
              <!-- 层级缩进 -->
              <div v-for="level in scope.row._level" :key="level" class="tree-indent" :style="{ width: `${indentWidth}px` }"></div>
              
              <!-- 展开/收起图标 -->
              <span v-if="hasChildren(scope.row)" class="expand-icon-container">
                <i
                  v-if="expandedRows.includes(scope.row[rowKey])"
                  class="el-icon-minus"
                  @click.stop="toggleRowExpansion(scope.row)"
                  style="cursor: pointer; margin-right: 5px"
                ></i>
                <i
                  v-else
                  class="el-icon-plus"
                  @click.stop="toggleRowExpansion(scope.row)"
                  style="cursor: pointer; margin-right: 5px"
                ></i>
              </span>
              
              <!-- 连接-->
              <span v-else class="tree-placeholder" style="width: 24px; display: inline-block;"></span>
              
              <!-- 节点内容 -->
              <span>{{ scope.row[column.prop] }}</span>
            </div>
          </template>
        </el-table-column>
      </template>
      
      <!-- 操作-->
      <el-table-column
        v-if="showActions"
        label="操作"
        :min-width="actionsWidth || 150"
        :fixed="actionsFixed || false"
        :align="align"
      >
        <template #default="scope">
          <slot name="actions" :row="scope.row" :index="scope.$index" ></slot>
        </template>
      </el-table-column>
      
      <!-- 空状态插槽 -->
      <template #empty>
        <div v-if="!loading && processedData && processedData.length === 0">
          <slot name="empty">
            <el-empty description="暂无数据" />
          </slot>
        </div>
      </template>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'TreeTable',
  props: {
    // 表格数据
    data: {
      type: Array,
      default: () => []
    },
    // 列配置
    columns: {
      type: Array,
      default: () => []
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 是否显示边框
    border: {
      type: Boolean,
      default: true
    },
    // 表格高度
    height: {
      type: [String, Number],
      default: ''
    },
    // 表格最大高度
    maxHeight: {
      type: [String, Number],
      default: ''
    },
    // 是否为斑马纹
    stripe: {
      type: Boolean,
      default: false
    },
    // 行数据的主键
    rowKey: {
      type: String,
      default: 'id'
    },
    // 默认排序
    defaultSort: {
      type: Object,
      default: () => ({})
    },
    // 提示框主题
    tooltipEffect: {
      type: String,
      default: 'dark',
      validator: (value) => ['dark', 'light'].includes(value)
    },
    // 表头样式
    headerCellStyle: {
      type: [Object, Function],
      default: () => ({})
    },
    // 单元格样式
    cellStyle: {
      type: [Object, Function],
      default: () => ({})
    },
    // 行样式类名
    rowClassName: {
      type: [String, Function],
      default: ''
    },
    // 水平滚动
    scrollX: {
      type: [String, Boolean, Number],
      default: true
    },
    // 垂直滚动
    scrollY: {
      type: [String, Boolean, Number],
      default: ''
    },
    // 是否在复选框状态为 indeterminate 时，点击行也会触发选择
    selectOnIndeterminate: {
      type: Boolean,
      default: true
    },
    // 对齐方式
    align: {
      type: String,
      default: 'left',
      validator: (value) => ['left', 'center', 'right'].includes(value)
    },
    // 空状态文本
    emptyText: {
      type: String,
      default: '暂无数据'
    },
    // 表格布局
    tableLayout: {
      type: String,
      default: 'auto',
      validator: (value) => ['auto', 'fixed'].includes(value)
    },
    // 是否显示复选框
    showSelection: {
      type: Boolean,
      default: false
    },
    // 复选框列宽
    selectionWidth: {
      type: [String, Number],
      default: 55
    },
    // 多选时是否保留已选择的项
    reserveSelection: {
      type: Boolean,
      default: false
    },
    // 行是否可以选择的函数
    selectable: {
      type: Function,
      default: null
    },
    // 是否显示展开
    showExpand: {
      type: Boolean,
      default: false
    },
    // 展开列宽
    expandWidth: {
      type: [String, Number],
      default: 55
    },
    // 是否显示操作
    showActions: {
      type: Boolean,
      default: false
    },
    // 操作列宽
    actionsWidth: {
      type: [String, Number],
      default: 150
    },
    // 操作列是否固定
    actionsFixed: {
      type: [String, Boolean],
      default: false
    },
    // 树形结构配置
    treeProps: {
      type: Object,
      default: () => ({
        children: 'children',
        hasChildren: 'hasChildren'
      })
    },
    // 缩进宽度
    indentWidth: {
      type: Number,
      default: 20
    },
    // 是否自动展开所有节点
    defaultExpandAll: {
      type: Boolean,
      default: false
    },
    // 是否显示全部展开和全部收起功能
    showExpandAll: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      expandedRows: [] // 存储展开的行ID
    }
  },
  computed: {
    // 处理后的扁平化数据
    processedData() {
      if (!this.data || this.data.length === 0) {
        return []
      }
      
      const flatData = []
      const { children } = this.treeProps
      
      // 递归扁平化数据并添加层级信息
      const flattenTree = (nodes, level = 0, parentIds = []) => {
        nodes.forEach(node => {
          // 深拷贝节点，避免修改原始数据
          const nodeCopy = { ...node }
          // 添加层级信息
          nodeCopy._level = level
          nodeCopy._parentIds = [...parentIds]
          
          // 确保children属性存在
          if (!nodeCopy[children]) {
            nodeCopy[children] = []
          }
          
          // 添加到扁平化数据
          flatData.push(nodeCopy)
          
          // 递归处理子节点
          if (nodeCopy[children] && nodeCopy[children].length > 0) {
            flattenTree(nodeCopy[children], level + 1, [...parentIds, nodeCopy[this.rowKey]])
          }
        })
      }
      
      // 开始扁平化处理
      flattenTree(this.data)
      
      // 关键逻辑：如果默认展开全部或者展开列表有节点
      let result
      if (this.defaultExpandAll) {
                result = flatData
      } else if (this.expandedRows.length === 0) {
                result = flatData.filter(row => row._level === 0)
      } else {
                result = flatData.filter(row => {
          // 根节点始终显示
          if (row._level === 0) {
            return true
          }
          
          // 检查是否有任何父节点在展开列表
          const hasExpandedParent = row._parentIds.some(parentId => this.expandedRows.includes(parentId))
          return hasExpandedParent
        })
      }
      
            return result
    }
  },
  watch: {
    // 监听数据变化，重新计算展开状态
    data: {
      deep: true,
      handler() {
        if (this.defaultExpandAll && this.showExpandAll) {
          this.expandAll()
        }
      }
    },
    // 监听defaultExpandAll变化
    defaultExpandAll: {
      immediate: true,
      handler(newVal) {
        if (newVal && this.showExpandAll) {
          this.expandAll()
        } else if (!newVal) {
          this.collapseAll()
        }
      }
    }
  },
  methods: {
    // 检查节点是否有子节点
    hasChildren(row) {
      const { children, hasChildren } = this.treeProps
      if (hasChildren && row[hasChildren] !== undefined) {
        return row[hasChildren]
      }
      return row[children] && row[children].length > 0
    },
    
    // 切换行展开状态
    toggleRowExpansion(row) {
      const rowId = row[this.rowKey]
      const index = this.expandedRows.indexOf(rowId)
      
      if (index > -1) {
        // 收起节点
        this.expandedRows.splice(index, 1)
      } else {
        // 展开节点
        this.expandedRows.push(rowId)
      }
      
      // 确保DOM更新完成后发出事件
      this.$nextTick(() => {
        this.$emit('expand-change', row, index === -1)
      })
    },
    
    // 展开所有节点
    expandAll() {
      // 如果不显示全部展开功能，则直接返回
      if (!this.showExpandAll) {
        return
      }
      
            
      // 强制重新创建expandedRows数组以确保响应式更新
      this.expandedRows = []
      
      // 收集所有有子节点的节点ID
      const allParentIds = []
      const { children } = this.treeProps
      
      // 递归收集所有有子节点的节点ID
      const collectAllParentIds = (nodes) => {
        if (!nodes || nodes.length === 0) return
        
        nodes.forEach(node => {
          // 使用hasChildren方法检查节点是否可展开
          if (this.hasChildren(node)) {
            allParentIds.push(node[this.rowKey])
            // 递归处理子节点
            if (node[children] && node[children].length > 0) {
              collectAllParentIds(node[children])
            }
          }
        })
      }
      
      // 从原始数据开始收集
      collectAllParentIds(this.data)
      
            
      // 使用Vue 2的响应式方式更新数组
      // 使用setTimeout确保在DOM更新周期之外进行操作
      setTimeout(() => {
        // 逐个添加ID，确保每个添加操作都能触发响应式更新
        allParentIds.forEach((id, index) => {
          setTimeout(() => {
            this.expandedRows.push(id)
            
            // 如果是最后一个ID，确保表格布局更新
            if (index === allParentIds.length - 1) {
              this.$nextTick(() => {
                if (this.$refs.treeTable) {
                                    this.$refs.treeTable.doLayout()
                }
                                this.$emit('expand-change', null, true)
              })
            }
          }, index * 0) // 小延迟确保每个操作都是独立的
        })
      }, 0)
    },
    
    // 收起所有节点
    collapseAll() {
      // 如果不显示全部收起功能，则直接返回
      if (!this.showExpandAll) {
        return
      }
      
      // 清空展开的行
      this.expandedRows = []
      
      // 确保DOM更新完成后发出事件
      this.$nextTick(() => {
        this.$emit('expand-change', null, false)
      })
    },
    
    // 多选框选中数据发生变化时的回调
    handleSelectionChange(selection) {
      this.$emit('selection-change', selection)
    },
    
    // 处理操作按钮点击
    handleActionClick(action, row) {
      this.$emit('row-action', { action: action.action, row: row })
    },
    
    // 排序变化时的回调
    handleSortChange({ column, prop, order }) {
      this.$emit('sort-change', { column, prop, order })
    },
    
    // 筛选变化时的回调
    handleFilterChange(filters) {
      this.$emit('filter-change', filters)
    },
    
    // 单元格点击时的回调
    handleCellClick(row, column, cell, event) {
      this.$emit('cell-click', row, column, cell, event)
    },
    
    // 行点击时的回调
    handleRowClick(row, column, event) {
      this.$emit('row-click', row, column, event)
    },
    
    // 表头点击时的回调
    handleHeaderClick(column, event) {
      this.$emit('header-click', column, event)
    },
    
    // 当前行变化时的回调
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.$emit('current-change', currentRow, oldCurrentRow)
    },
    
    // 表头右键菜单时的回调
    handleHeaderContextmenu(column, event) {
      this.$emit('header-contextmenu', column, event)
    },
    
    // 行右键菜单时的回调
    handleRowContextmenu(row, column, event) {
      this.$emit('row-contextmenu', row, column, event)
    },
    
    // 清空所有选择
    clearSelection() {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.clearSelection()
      }
    },
    
    // 切换所有行的选中状态
    toggleRowSelection(row, selected) {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.toggleRowSelection(row, selected)
      }
    },
    
    // 滚动到指定位置
    scrollTo(x, y) {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.$refs.bodyWrapper.scrollTo(x, y)
      }
    }
  }
}
</script>

<style scoped>
.tree-table-container {
  width: 100%;
}

.el-table {
  width: 100% !important;
}

.el-table .cell {
  overflow: visible;
  display: flex;
  align-items: center;
}

/* 确保树形结构的第一列内容在同一*/
.el-table .cell > div {
  display: flex;
  align-items: center;
  width: 100%;
}

.el-table .el-icon-plus,
.el-table .el-icon-minus {
  font-size: 12px;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  display: inline-block;
  vertical-align: middle;
}

.tree-indent {
  display: inline-block;
  height: 20px;
  position: relative;
}

.tree-indent::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 0;
  border-left: 1px dashed #DCDFE6;
}

.expand-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin: 0 5px;
}

.tree-placeholder {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin: 0 5px;
}

/* 确保图标和文本在同一*/
.expand-icon-container + span,
.tree-placeholder + span {
  display: inline-block;
  vertical-align: middle;
}
</style>