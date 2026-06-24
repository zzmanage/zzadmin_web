import { defineStore } from 'pinia'
import { getLocalStorage, setLocalStorage } from '../utils/common/storage-utils'

export const useAppStore = defineStore('app', {
  state: () => {
    return {
      isCollapse: false,
      siteSettings: getLocalStorage('siteSettings', {
        siteName: 'zzadmin管理系统',
        siteEmail: '',
        siteLogo: '',
        theme: 'light',
        copyright: '© 2023 zzadmin. All rights reserved.'
      })
    }
  },
  actions: {
    toggleCollapse() {
      this.isCollapse = !this.isCollapse
    },

    toggleSidebar() {
      this.isCollapse = !this.isCollapse
    },

    collapseSidebar(value) {
      this.isCollapse = value
    },

    updateSiteSettings(settings) {
      this.siteSettings = { ...this.siteSettings, ...settings }
      setLocalStorage('siteSettings', this.siteSettings)

      if (settings.siteName) {
        document.title = settings.siteName
      }

      if (settings.theme !== undefined) {
        this.applyTheme(settings.theme)
      }
    },

    applyTheme(theme) {
      const html = document.documentElement
      html.classList.remove('dark', 'light')
      html.classList.add(theme)

      if (theme === 'dark') {
        html.style.backgroundColor = '#1a1a2e'
        html.style.color = '#ffffff'
      } else {
        html.style.backgroundColor = '#f5f7fa'
        html.style.color = '#303133'
      }
    },

    initTheme() {
      const theme = this.siteSettings.theme || 'light'
      this.applyTheme(theme)
    },

    getSiteSettings() {
      return this.siteSettings
    }
  }
})

export default useAppStore