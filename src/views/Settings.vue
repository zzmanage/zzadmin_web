<template>
    <div class="settings-container">
      <h1>网站设置</h1>
      <el-card class="settings-card">
        <el-form :model="settings" label-width="120px">
          <el-form-item label="站点名称">
            <el-input v-model="settings.siteName" placeholder="请输入网站标题"/>
          </el-form-item>
          <el-form-item label="站点邮箱">
            <el-input v-model="settings.siteEmail" placeholder="请输入网站联系邮箱"/>
          </el-form-item>
          <el-form-item label="站点Logo">
            <el-input v-model="settings.siteLogo" placeholder="请输入Logo图片URL"/>
          </el-form-item>
          <el-form-item label="主题">
            <el-select v-model="settings.theme" placeholder="选择主题">
              <el-option label="亮色" value="light"/>
              <el-option label="暗色" value="dark"/>
            </el-select>
          </el-form-item>
          <el-form-item label="版权信息">
            <el-input v-model="settings.copyright" placeholder="请输入版权信息" type="textarea"/>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveSettings">保存设置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </template>
  
<script>
import { useAppStore } from '../store/app'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { reactive } from 'vue'
  
export default {
  name: 'Settings',
  setup() {
    const appStore = useAppStore()
    const { siteSettings } = storeToRefs(appStore)
      
    // 使用Vue的reactive创建响应式对象，使值可以被修改
    const settings = reactive({
      siteName: siteSettings.value.siteName || 'zzadmin管理系统',
      siteEmail: siteSettings.value.siteEmail || 'admin@example.com',
      siteLogo: siteSettings.value.siteLogo || '',
      theme: siteSettings.value.theme || 'light',
      copyright: siteSettings.value.copyright || '© 2023 zzadmin管理系统. All rights reserved.'
    })
      
    const saveSettings = () => {
      // 更新store中的设置
      appStore.updateSiteSettings(settings)
        
      // 显示成功提示
      ElMessage.success('设置保存成功')
    }
      
    return {
      settings,
      saveSettings
    }
  }
}
</script>
  
  <style scoped>
  .settings-container {
    padding: 20px;
  }
  
  .settings-card {
    margin-top: 20px;
    padding: 20px;
  }
  
  h1 {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 20px;
  }
  
  /* 优化表单元素宽度，使其不要太*/
  .settings-card :deep(.el-input),
  .settings-card :deep(.el-select),
  .settings-card :deep(.el-textarea) {
    width: 400px;
    max-width: 100%;
  }
  
  /* 表单标签宽度统一 */
  .settings-card :deep(.el-form-item__label) {
    width: 120px;
  }
  
  /* 响应式设计，适应不同屏幕宽度 */
  @media screen and (max-width: 768px) {
    .settings-card :deep(.el-input),
    .settings-card :deep(.el-select),
    .settings-card :deep(.el-textarea) {
      width: 100%;
    }
  }
  </style>
  