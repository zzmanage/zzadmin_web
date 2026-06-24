// src/store/user.js
import { defineStore } from 'pinia'
import { getSessionStorage, setSessionStorage, removeSessionStorage, STORAGE_TYPES } from '../utils/common/storage-utils'
import { clearAuthInfo, setAuthInfo } from '../utils/auth'

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      username: getSessionStorage('username') || '',
      isAuthenticated: !!getSessionStorage(STORAGE_TYPES.SESSION.AUTH_TOKEN),
      token: getSessionStorage(STORAGE_TYPES.SESSION.AUTH_TOKEN) || '',
      refreshToken: getSessionStorage(STORAGE_TYPES.SESSION.REFRESH_TOKEN) || '',
      userId: getSessionStorage(STORAGE_TYPES.SESSION.USER_ID) || '',
      tenantId: getSessionStorage(STORAGE_TYPES.SESSION.TENANT_ID) || '',
      tenantName: getSessionStorage(STORAGE_TYPES.SESSION.TENANT_NAME) || '',
      tenantRole: getSessionStorage(STORAGE_TYPES.SESSION.TENANT_ROLE) || '',
      tenants: [],
    }
  },
  actions: {
    login(username, token, refreshToken, userId) {
      this.username = username
      this.isAuthenticated = true
      this.token = token
      this.refreshToken = refreshToken
      this.userId = userId

      setAuthInfo({
        token,
        refreshToken,
        username,
        userId
      })
    },
    setTenants(tenants) {
      this.tenants = tenants
      if (tenants.length > 0 && !this.tenantId) {
        this.switchTenant(tenants[0])
      }
    },
    switchTenant(tenant) {
      this.tenantId = tenant.id
      this.tenantName = tenant.name
      this.tenantRole = tenant.role
      setSessionStorage(STORAGE_TYPES.SESSION.TENANT_ID, tenant.id)
      setSessionStorage(STORAGE_TYPES.SESSION.TENANT_NAME, tenant.name)
      setSessionStorage(STORAGE_TYPES.SESSION.TENANT_ROLE, tenant.role)
    },
    logout() {
      this.username = ''
      this.isAuthenticated = false
      this.token = ''
      this.refreshToken = ''
      this.userId = ''
      this.tenantId = ''
      this.tenantName = ''
      this.tenantRole = ''
      this.tenants = []

      removeSessionStorage(STORAGE_TYPES.SESSION.TENANT_ID)
      removeSessionStorage(STORAGE_TYPES.SESSION.TENANT_NAME)
      removeSessionStorage(STORAGE_TYPES.SESSION.TENANT_ROLE)

      clearAuthInfo()
    },
    loadUserInfo() {
      if (this.token && this.username) {
        this.isAuthenticated = true
        return true
      }
      return false
    },
    updateToken(newToken, newRefreshToken) {
      this.token = newToken
      this.refreshToken = newRefreshToken

      setSessionStorage(STORAGE_TYPES.SESSION.AUTH_TOKEN, newToken)
      setSessionStorage(STORAGE_TYPES.SESSION.REFRESH_TOKEN, newRefreshToken)
    }
  },
})

export default useUserStore