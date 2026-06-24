<template>
  <el-dialog
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :modal="modal"
    :modal-append-to-body="modalAppendToBody"
    :append-to-body="appendToBody"
    :custom-class="customClass"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :center="center"
    :visible="visible"
    @open="handleOpen"
    @close="handleClose"
    @closed="handleClosed"
  >
    <el-form
      ref="dialogFormRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      :size="formSize"
      :disabled="loading || disabled"
    >
      <!-- 表单-->
      <template v-for="(item, index) in formItems" :key="index">
        <el-form-item
          v-if="!item.hidden || item.hidden === false"
          :label="getSafeLabel(item.label)"
          :prop="item.prop"
          :rules="item.rules || rules[item.prop]"
          :label-width="item.labelWidth || labelWidth"
          :required="item.required"
        >
          <!-- 输入-->
          <el-input
            v-if="item.type === 'input'"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请输{typeof item.label === 'string'  item.label : ''}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled || disabled || loading"
            :maxlength="item.maxlength"
            :show-word-limit="item.showWordLimit"
            :type="item.inputType || 'text'"
            :rows="item.rows"
            :autosize="item.autosize"
            :style="{ width: item.width || '100%' }"
          />
          
          <!-- 密码输入-->
          <el-input
            v-else-if="item.type === 'password'"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请输{typeof item.label === 'string'  item.label : ''}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled || disabled || loading"
            :maxlength="item.maxlength"
            type="password"
            show-password
            :style="{ width: item.width || '100%' }"
          />
          
          <!-- 输入数字 -->
          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请输{item.label}`"
            :min="item.min"
            :max="item.max"
            :step="item.step"
            :disabled="item.disabled || disabled || loading"
          />
          
          <!-- 选择-->
          <el-select
            v-else-if="item.type === 'select'"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请选择${typeof item.label === 'string' ? item.label : ''}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled || disabled || loading"
            :multiple="item.multiple || false"
            :filterable="item.filterable || false"
            :remote="item.remote || false"
            :remote-method="item.remoteMethod"
            :loading="item.selectLoading"
            @change="handleSelectChange($event, item.prop, item.onChange)"
            :style="{ width: item.width || '100%' }"
          >
            <el-option
              v-for="option in item.options"
              :key="option.value || option"
              :label="option.label || option"
              :value="option.value"
            />
          </el-select>
          
          <!-- 开-->
          <el-switch
            v-else-if="item.type === 'switch'"
            v-model="formData[item.prop]"
            :disabled="item.disabled || disabled || loading"
            :active-text="item.activeText"
            :inactive-text="item.inactiveText"
            :active-color="item.activeColor"
            :inactive-color="item.inactiveColor"
            @change="item.onChange"
          />
          
          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="item.type === 'date'"
            v-model="formData[item.prop]"
            :type="item.dateType || 'date'"
            :range-separator="item.rangeSeparator || '-'"
            :start-placeholder="item.startPlaceholder || '开始日期'"
            :end-placeholder="item.endPlaceholder || '结束日期'"
            :placeholder="item.placeholder || '选择日期'"
            :disabled="item.disabled || disabled || loading"
            @change="item.onChange"
            :style="{ width: item.width || '100%' }"
          />
          
          <!-- 级联选择-->
          <el-cascader
            v-else-if="item.type === 'cascader'"
            v-model="formData[item.prop]"
            :options="item.options"
            :props="typeof item.props === 'object' ? item.props : {}"
            :placeholder="item.placeholder || `请选择${typeof item.label === 'string' ? item.label : ''}`"
            :clearable="item.clearable !== false"
            :disabled="item.disabled || disabled || loading"
            @change="item.onChange"
            :style="{ width: item.width || '100%' }"
          />
          
          <!-- 单选框-->
          <el-radio-group
            v-else-if="item.type === 'radio'"
            v-model="formData[item.prop]"
            :disabled="item.disabled || disabled || loading"
          >
            <el-radio
              v-for="option in item.options"
              :key="option.value || option"
              :label="option.value || option"
            >
              {{ option.label || option }}
            </el-radio>
          </el-radio-group>
          
          <!-- 多选框-->
          <el-checkbox-group
            v-else-if="item.type === 'checkbox'"
            v-model="formData[item.prop]"
            :disabled="item.disabled || disabled || loading"
          >
            <el-checkbox
              v-for="option in item.options"
              :key="option.value || option"
              :label="option.value || option"
            >
              {{ option.label || option }}
            </el-checkbox>
          </el-checkbox-group>
          
          <!-- 自定义组-->
          <template v-else-if="item.type === 'custom'">
            <slot :name="`custom-${item.prop}`" :form-data="formData" :item="item" ></slot>
          </template>
          
          <!-- 默认使用输入-->
          <el-input
            v-else
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || `请输{item.label}`"
            :style="{ width: item.width || '100%' }"
          />
        </el-form-item>
      </template>
      
      <!-- 自定义内容插-->
      <slot name="custom-content" :form-data="formData" ></slot>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button
          @click="handleCancel"
          :loading="loading"
        >
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          {{ submitText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'DialogForm',
  model: {
    prop: 'visible',
    event: 'update:visible'
  },
  props: {
    // 弹窗可见性
    visible: {
      type: Boolean,
      default: false
    },
    // 弹窗标题
    title: {
      type: String,
      default: ''
    },
    // 编辑模式标识
    isEdit: {
      type: Boolean,
      default: false
    },
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
    // 弹窗宽度
    width: {
      type: String,
      default: '50%'
    },
    // 是否全屏
    fullscreen: {
      type: Boolean,
      default: false
    },
    // 是否显示遮罩
    modal: {
      type: Boolean,
      default: true
    },
    // 遮罩是否插入到body元素
    modalAppendToBody: {
      type: Boolean,
      default: true
    },
    // 弹窗是否插入到body元素
    appendToBody: {
      type: Boolean,
      default: false
    },
    // 自定义类名
    customClass: {
      type: String,
      default: ''
    },
    // 点击遮罩是否关闭弹窗
    closeOnClickModal: {
      type: Boolean,
      default: false
    },
    // 按下ESC键是否关闭弹窗
    closeOnPressEscape: {
      type: Boolean,
      default: true
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      default: true
    },
    // 内容是否居中
    center: {
      type: Boolean,
      default: false
    },
    // 标签宽度
    labelWidth: {
      type: String,
      default: '100px'
    },
    // 表单大小
    formSize: {
      type: String,
      default: 'default',
      validator: (value) => ['large', 'default', 'small'].includes(value)
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 禁用状态
    disabled: {
      type: Boolean,
      default: false
    },
    // 提交按钮文本
    submitText: {
      type: String,
      default: '确定'
    },
    // 取消按钮文本
    cancelText: {
      type: String,
      default: '取消'
    }
  },
  data() {
    return {
      // 保存初始表单数据，用于重      initialFormData: {}
    }
  },
  computed: {
    // 根据编辑模式自动设置标题
    dialogTitle() {
      if (this.title) {
        return this.title
      }
      return this.isEdit ? '编辑' : '添加'
    }
  },
  mounted() {
    // 组件挂载后，预处理表单数据类型
    this.$nextTick(() => {
      this.preprocessFormData()
    })
  },
  
  watch: {
    // 当弹窗打开时，重新预处理表单数据类型
    visible: {
      handler(newVal) {
        if (newVal) {
          this.$nextTick(() => {
            this.preprocessFormData()
          })
        }
      }
    },
    // 监听表单数据变化
    formData: {
      handler(newVal) {
        this.$emit('formDataChange', newVal)
      },
      deep: true
    }
  },
  methods: {
    // 获取安全的label值，确保返回字符串类型
    getSafeLabel(label) {
      if (label === undefined || label === null) {
        return ''
      }
      if (typeof label === 'object') {
        console.warn('发现对象类型的label属性，已转换为字符', label)
        // 尝试从对象中提取有用的字符串信息
        if (label.label) {
          return String(label.label)
        }
        if (label.name) {
          return String(label.name)
        }
        return JSON.stringify(label).substring(0, 50) + '...'
      }
      return String(label)
    },
    
    // 弹窗打开时的回调
    handleOpen() {
      this.$emit('open')
    },
    
    // 弹窗关闭时的回调
    handleClose() {
            // 弹窗关闭时发出close事件
      this.$emit('close')
    },
    
    // 弹窗完全关闭后的回调
    handleClosed() {
      this.$emit('closed')
    },
    
    // 处理取消
    handleCancel() {
      // 与TaskConfig保持一致的简单实现
      this.$emit('update:visible', false)
      this.$emit('cancel')
          },
    
    // 处理提交
    handleSubmit() {
      this.$refs.dialogFormRef.validate((valid) => {
        if (valid) {
          this.$emit('submit', this.formData)
        }
      })
    },
    
    // 处理选择框变化，根据字段配置决定值的类型
    handleSelectChange(value, prop, onChange) {
      // 查找当前字段配置
      const fieldConfig = this.formItems.find(item => item.prop === prop)
      
      // 根据字段配置的valueType决定如何处理
      let processedValue = value
      if (fieldConfig && fieldConfig.valueType === 'number') {
        // 如果配置了需要数字类型的值，则转换为数字
        processedValue = Number(value)
      }
      
      // 更新表单数据
      this.formData[prop] = processedValue
      
      // 触发外部onChange回调（如果有）
      if (onChange) {
        onChange(processedValue)
      }
    },
    
    // 预处理表单数据类型
    preprocessFormData() {
      this.formItems.forEach(item => {
        if (item.valueType === 'number' && item.prop in this.formData) {
          const currentValue = this.formData[item.prop]
          // 确保值是数字类型
          if (currentValue !== null && currentValue !== undefined) {
            this.formData[item.prop] = Number(currentValue)
          }
        }
      })
    },

    // 重置表单
    resetForm() {
      if (this.$refs.dialogFormRef) {
        this.$refs.dialogFormRef.resetFields()
        // 重置为初始数据
        Object.assign(this.formData, this.initialFormData)
      }
    },
    
    // 手动校验表单
    validate(callback) {
      if (this.$refs.dialogFormRef) {
        this.$refs.dialogFormRef.validate(callback)
      } else {
        callback(true)
      }
    },
    
    // 设置表单数据
    setFormData(data) {
      this.initialFormData = { ...data }
      Object.assign(this.formData, data)
      this.$nextTick(() => {
        if (this.$refs.dialogFormRef) {
          this.$refs.dialogFormRef.clearValidate()
        }
      })
    }
  }
}
</script>

<style scoped>
/* 可根据需要添加自定义样式 */
</style>