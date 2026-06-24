<template>
  <el-card class="search-container">
    <el-form
      :inline="inline"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      ref="searchFormRef"
      @submit.native.prevent
    >
      <!-- 表单-->
      <template v-for="(item, index) in formItems" :key="index">
        <el-form-item
          v-if="!item.hidden || item.hidden === false"
          :label="item.label"
          :prop="item.prop"
          :rules="item.rules"
          :label-width="item.labelWidth || labelWidth"
          :style="item.style"
        >
          <!-- 输入-->
          <el-input
            v-if="item.type === 'input'"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请输入${item.label}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled || false"
            :style="{ width: item.width }"
            @keyup.enter="handleSearch"
          />
          
          <!-- 选择-->
          <el-select
            v-else-if="item.type === 'select'"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请选择${item.label ? item.label : ''}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled || false"
            :style="{ width: item.width || '200px', minWidth: '150px' }"
            :filterable="item.filterable || false"
          >
            <el-option
              v-for="option in item.options"
              :key="option.value || option"
              :label="option.label || option"
              :value="option.value || option"
            />
          </el-select>
          
          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="item.type === 'date'"
            v-model="formData[item.prop]"
            :type="item.dateType || 'date'"
            :range-separator="item.rangeSeparator || '-'"
            :start-placeholder="item.startPlaceholder || '开始日期'"
            :end-placeholder="item.endPlaceholder || '结束日期'"
            :placeholder="item.placeholder || '选择日期'"
            :disabled="item.disabled || false"
            :style="{ width: item.width }"
            @change="item.onChange"
          />
          
          <!-- 级联选择-->
          <el-cascader
            v-else-if="item.type === 'cascader'"
            v-model="formData[item.prop]"
            :options="item.options"
            :props="item.props || {}"
            :placeholder="item.placeholder || `请选择${item.label ? item.label : ''}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled || false"
            :style="{ width: item.width }"
            @change="item.onChange"
          />
          
          <!-- 自定义组-->
          <template v-else-if="item.type === 'custom'">
            <slot :name="`custom-${item.prop}`">
              {{ item.defaultContent }}
            </slot>
          </template>
          
          <!-- 默认使用输入-->
          <el-input
            v-else
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请输入${item.label}`"
            :style="{ width: item.width }"
          />
        </el-form-item>
      </template>
      
      <!-- 操作按钮 -->
      <el-form-item v-if="showActionButtons !== false">
        <el-button
          type="primary"
          @click="handleSearch"
          :loading="loading"
          :style="{ marginRight: '10px' }"
        >
          搜索
        </el-button>
        <el-button
          @click="handleReset"
          :loading="loading"
          :style="{ marginRight: '10px' }"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>
    
    <!-- 额外按钮区域 - 始终显示在新的一-->
    <div v-if="$slots['extra-buttons']" class="extra-buttons-container">
      <slot name="extra-buttons" ></slot>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'SearchForm',
  props: {
    // 表单数据
    formData: {
      type: Object,
      required: true
    },
    // 表单项配置
    formItems: {
      type: Array,
      default: () => []
    },
    // 表单规则
    rules: {
      type: Object,
      default: () => ({})
    },
    // 是否为行内表单
    inline: {
      type: Boolean,
      default: true
    },
    // 标签宽度
    labelWidth: {
      type: String,
      default: 'auto'
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 是否显示操作按钮
    showActionButtons: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 保存初始表单数据，用于重置
      initialFormData: {}
    }
  },
  watch: {
    // 监听表单数据变化，同步初始数据
    formData: {
      handler(newVal) {
        this.initialFormData = { ...newVal }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    // 格式化参数，确保布尔值和空值正确处理
    formatParams(data) {
      const formatted = {}
      
      Object.keys(data).forEach(key => {
        // 处理可能的嵌套对象情况
        if (typeof data[key] === 'object' && data[key] !== null) {
          // 检查是否是包含value字段的对象
          if ('value' in data[key]) {
            // 如果是包含value字段的对象，直接使用value值
            formatted[key] = data[key].value
          } else {
            // 其他对象类型保留原样
            formatted[key] = data[key]
          }
        } else if (data[key] === '' || data[key] === null || data[key] === undefined) {
          // 跳过空值
          return
        } else {
          // 保留其他值
          formatted[key] = data[key]
        }
      })
      return formatted
    },
    
    // 处理搜索
    handleSearch() {
      this.$refs.searchFormRef.validate((valid) => {
        if (valid) {
          // 格式化参数后再发出搜索事件
          const formattedData = this.formatParams(this.formData)
                    this.$emit('search', formattedData)
        }
      })
    },
    
    // 处理重置
    handleReset() {
      this.$refs.searchFormRef.resetFields()
      // 重置为初始数据
      Object.assign(this.formData, this.initialFormData)
      this.$emit('reset', this.formData)
    },
    
    // 手动校验表单
    validate(callback) {
      if (this.$refs.searchFormRef) {
        this.$refs.searchFormRef.validate(callback)
      } else {
        callback(true)
      }
    },
    
    // 手动重置表单
    resetFields() {
      if (this.$refs.searchFormRef) {
        this.$refs.searchFormRef.resetFields()
        Object.assign(this.formData, this.initialFormData)
      }
    }
  }
}
</script>

<style scoped>
.search-container {
  margin-bottom: 20px;
}

.extra-buttons-container {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}
</style>