<template>
  <el-table
    ref="dataTable"
    v-loading="loading"
    :data="data"
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
    <!-- 复选框-->
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
          <div class="action-buttons">
            <el-button
              v-for="(action, actionIndex) in column.actions"
              :key="actionIndex"
              :type="action.type || 'default'"
              :size="action.size || 'small'"
              :icon="action.icon"
              :disabled="action.disabled || false"
              @click.stop="handleActionClick(action, scope.row)"
            >
              {{ action.text }}
            </el-button>
          </div>
        </template>
        <!-- 自定义格式化器支持HTML -->
        <template v-else-if="column.formatter" #default="scope">
          <span v-html="column.formatter(scope.row)"></span>
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
    
    <!-- 空状态插-->
    <template #empty>
      <div v-if="!loading && data && data.length === 0">
        <slot name="empty">
          <el-empty description="暂无数据" />
        </slot>
      </div>
    </template>
  </el-table>
</template>

<script>
export default {
  name: 'DataTable',
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
      type: [String, Function],
      default: ''
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
    }
  },
  methods: {
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
      if (this.$refs.dataTable) {
        this.$refs.dataTable.clearSelection()
      }
    },
    
    // 切换所有行的选中状态
    toggleRowSelection(row, selected) {
      if (this.$refs.dataTable) {
        this.$refs.dataTable.toggleRowSelection(row, selected)
      }
    },
    
    // 滚动到指定位置
    scrollTo(x, y) {
      if (this.$refs.dataTable) {
        this.$refs.dataTable.$refs.bodyWrapper.scrollTo(x, y)
      }
    }
  }
}
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  justify-content: center;
}

.action-buttons .el-button {
  margin: 0;
}
</style>