<template>
  <div class="batch-actions-container">
    <div class="batch-actions-wrapper" v-if="showBatchActions">
      <!-- 选择信息展示 -->
      <div class="batch-actions-info" v-if="selectedCount > 0">
        <span class="selected-count">已选择 {{ selectedCount }} </span>
        <el-button 
          type="text" 
          size="small" 
          @click="handleClearSelection"
          :disabled="disabled"
          class="clear-selection-btn"
        >
          清空选择
        </el-button>
      </div>
      
      <!-- 批量操作按钮-->
      <div class="batch-actions-buttons" v-if="batchButtons.length > 0">
        <el-button-group>
          <template v-for="(button, index) in batchButtons" :key="index">
            <el-button
              :type="button.type || 'default'"
              :size="button.size || 'small'"
              :icon="button.icon"
              :disabled="!button.alwaysEnabled && (selectedCount === 0 || disabled || loading)"
              :loading="button.loading || loading"
              @click="handleBatchAction(button.action, button)"
              :class="button.class"
              :style="button.style"
            >
              {{ button.label }}
            </el-button>
          </template>
        </el-button-group>
      </div>
      
      <!-- 自定义操作区-->
      <div class="batch-actions-custom" v-if="hasCustomSlot">
        <slot name="custom-actions" :selected-count="selectedCount" :selected-rows="selectedRows" ></slot>
      </div>
    </div>
    
    <!-- 无批量数据时的提-->
    <div v-else-if="!showBatchActions" class="batch-actions-tip">
      <slot name="empty-tip">请先选择数据</slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BatchActions',
  props: {
    // 已选择的数据项数量
    selectedCount: {
      type: Number,
      default: 0
    },
    // 已选择的数据行
    selectedRows: {
      type: Array,
      default: () => []
    },
    // 是否显示批量操作区域
    showBatchActions: {
      type: Boolean,
      default: true
    },
    // 批量操作按钮配置
    batchButtons: {
      type: Array,
      default: () => [
        // 示例配置
        // {
        //   label: '批量删除',
        //   type: 'danger',
        //   icon: 'el-icon-delete',
        //   action: 'delete',
        //   alwaysEnabled: false
        // }
      ]
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 是否显示清空选择按钮
    showClearSelection: {
      type: Boolean,
      default: true
    }
  },
  emits: ['clear-selection', 'batch-action'],
  computed: {
    // 检查是否有自定义操作插槽
    hasCustomSlot() {
      return this.$slots['custom-actions'] !== undefined
    }
  },
  methods: {
    // 清空选择
    handleClearSelection() {
      if (!this.disabled && !this.loading) {
        this.$emit('clear-selection')
      }
    },
    
    // 处理批量操作
    handleBatchAction(action, buttonConfig) {
      if (!this.disabled && !this.loading) {
        this.$emit('batch-action', action, this.selectedRows, buttonConfig)
      }
    },
    
    // 检查是否可以执行某个操作
    canExecuteAction(actionKey) {
      if (this.disabled || this.loading) {
        return false
      }
      
      const button = this.batchButtons.find(btn => btn.action === actionKey)
      if (button && button.alwaysEnabled) {
        return true
      }
      
      return this.selectedCount > 0
    },
    
    // 手动触发批量操作
    triggerBatchAction(actionKey) {
      if (this.canExecuteAction(actionKey)) {
        const button = this.batchButtons.find(btn => btn.action === actionKey)
        if (button) {
          this.handleBatchAction(actionKey, button)
        }
      }
    }
  }
}
</script>

<style scoped>
.batch-actions-container {
  margin-bottom: 15px;
  padding: 12px 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.batch-actions-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.batch-actions-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}

.selected-count {
  font-weight: 500;
  color: #409eff;
}

.clear-selection-btn {
  color: #909399;
}

.batch-actions-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-actions-custom {
  flex: 1;
}

.batch-actions-tip {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

/* 适配移动端 */
@media screen and (max-width: 768px) {
  .batch-actions-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .batch-actions-buttons {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .batch-actions-custom {
    width: 100%;
  }
}
</style>