<template>
  <div class="tenant-selector" v-if="userStore.tenants.length > 0">
    <el-dropdown @command="handleSwitchTenant" trigger="click">
      <span class="tenant-dropdown-link">
        <el-icon><Folder /></el-icon>
        <span class="tenant-name-text">{{ userStore.tenantName || '选择租户' }}</span>
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="t in userStore.tenants"
            :key="t.id"
            :command="t"
            :class="{ 'is-active': t.id === userStore.tenantId }"
          >
            <span>{{ t.name }}</span>
            <el-tag size="small" type="info" style="margin-left: 8px">{{ roleLabel(t.role) }}</el-tag>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { useUserStore } from '../store/user'
import { Folder, ArrowDown } from '@element-plus/icons-vue'

const userStore = useUserStore()

const roleMap = {
  admin: '管理员',
  manager: '经理',
  user: '普通用户'
}

const roleLabel = (role) => roleMap[role] || role

const handleSwitchTenant = (tenant) => {
  if (tenant.id !== userStore.tenantId) {
    userStore.switchTenant(tenant)
    window.location.reload()
  }
}
</script>

<style scoped>
.tenant-selector {
  margin-right: 16px;
  display: flex;
  align-items: center;
}

.tenant-dropdown-link {
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 14px;
}

.tenant-name-text {
  margin: 0 4px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-active {
  background-color: #ecf5ff !important;
}
</style>
