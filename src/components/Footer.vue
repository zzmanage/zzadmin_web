<template>
    <div class="footer" style="background-color: #f5f5f5; padding: 10px; text-align: center;">
      <p>{{ siteSettings.copyright }}</p>
    </div>
  </template>
  
<script>
import { useAppStore } from '../store/app'
import { storeToRefs } from 'pinia'
  
export default {
  name: 'AppFooter',
  setup() {
    const appStore = useAppStore()
    const { siteSettings } = storeToRefs(appStore)
      
    return {
      siteSettings: siteSettings.value || {
        copyright: '© 2023 zzadmin管理系统. All rights reserved.'
      }
    }
  }
}
</script>
  
  <style scoped>
  .footer {
    width: 100%;
  }
  </style>
  