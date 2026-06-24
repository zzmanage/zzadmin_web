<template>
  <div class="pagination-container">
    <div class="pagination-info" v-if="showTotal">
      <span>{{ showTotalText || `${total} 条记录` }}</span>
    </div>
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :disabled="disabled"
      :background="background"
      :small="small"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #prev> 
        <slot name="prev" ></slot>
      </template>
      <template #next> 
        <slot name="next" ></slot>
      </template>
      <template #sizes> 
        <slot name="sizes" ></slot> 
      </template>
      <template #prev-text> 
        <slot name="prev-text" ></slot>
      </template>
      <template #next-text> 
        <slot name="next-text" ></slot>
      </template>
    </el-pagination>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    // 当前页码
    currentPage: {
      type: Number,
      default: 1
    },
    // 每页显示条数
    pageSize: {
      type: Number,
      default: 20
    },
    // 可选的每页显示条数
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    // 总记录数
    total: {
      type: Number,
      required: true
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否添加背景
    background: {
      type: Boolean,
      default: false
    },
    // 是否使用小型分页样式
    small: {
      type: Boolean,
      default: false
    },
    // 是否显示总条数信息
    showTotal: {
      type: Boolean,
      default: true
    },
    // 总条数显示文本
    showTotalText: {
      type: String,
      default: ''
    }
  },
  emits: ['size-change', 'current-change'],
  methods: {
    // 处理每页显示条数变化
    handleSizeChange(newSize) {
      this.$emit('size-change', newSize)
    },
    
    // 处理当前页码变化
    handleCurrentChange(newCurrent) {
      this.$emit('current-change', newCurrent)
    },
    
    // 跳转到指定页
    jumpToPage(page) {
      if (page && page > 0 && page <= Math.ceil(this.total / this.pageSize)) {
        this.handleCurrentChange(page)
      }
    },
    
    // 重置分页
    resetPagination() {
      this.handleCurrentChange(1)
    }
  }
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;
}

.pagination-info {
  font-size: 14px;
  color: #606266;
}

/* 适配移动*/
@media screen and (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    align-items: flex-end;
  }
  
  .pagination-info {
    margin-bottom: 10px;
    align-self: flex-start;
  }
}
</style>