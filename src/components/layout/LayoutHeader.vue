<template>
  <header class="header-container">
    <div class="header-left">
      <el-button
        link
        class="header-collapse-btn"
        @click="toggleSidebar"
      >
        <el-icon class="header-collapse-icon">
          <component :is="collapseIcon" />
        </el-icon>
      </el-button>
      <el-breadcrumb class="header-breadcrumb">
        <template v-for="(item, index) in breadcrumbList" :key="index">
          <el-breadcrumb-item v-if="item.path" :to="item.path">
            {{ item.title }}
          </el-breadcrumb-item>
          <el-breadcrumb-item v-else>
            {{ item.title }}
          </el-breadcrumb-item>
        </template>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="avatarUrl || defaultAvatar"></el-avatar>
          <span class="user-name">{{ authStore.displayName }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, Expand, Fold, User, SwitchButton } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStoragePreviewUrl } from '@/api/storage'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

function hasConcreteRoute(path?: string) {
  if (!path) {
    return false
  }
  return router.getRoutes().some((item) => item.path === path)
}

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

function findMenuTrail(
  nodes: Array<{ name: string; path?: string; children?: Array<any> }>,
  targetPath: string,
  trail: Array<{ title: string; path?: string }> = [],
): Array<{ title: string; path?: string }> | null {
  for (const node of nodes) {
    const normalizedPath = hasConcreteRoute(node.path) ? node.path : undefined
    const nextTrail = [...trail, { title: node.name, path: normalizedPath }]
    if (node.path === targetPath) {
      return nextTrail
    }
    if (node.children?.length) {
      const found = findMenuTrail(node.children, targetPath, nextTrail)
      if (found) {
        return found
      }
    }
  }
  return null
}

// 动态计算面包屑
const breadcrumbList = computed(() => {
  const menuTrail = findMenuTrail(authStore.sidebarMenus, route.path)
  if (menuTrail?.length) {
    return menuTrail
  }

  const breadcrumbs: Array<{ title: string; path?: string }> = []
  for (const routeItem of route.matched || []) {
    if (routeItem?.meta?.title && routeItem?.path && routeItem.path !== '/') {
      breadcrumbs.push({
        title: routeItem.meta.title as string,
        path: routeItem.path,
      })
    }
  }

  return breadcrumbs
})

const collapseIcon = computed(() => (appStore.sidebarCollapsed ? Expand : Fold))

const avatarUrl = computed(() => {
  const avatar = authStore.mine?.user?.avatar
  if (!avatar) {
    return ''
  }
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  if (avatar.startsWith('/')) {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'}${avatar}`
  }
  return getStoragePreviewUrl(avatar)
})

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      if (route.path !== '/profile') {
        await router.push('/profile')
      }
      break
    case 'logout':
      await authStore.logout()
      router.push('/login')
      ElMessage.success('退出登录成功')
      break
  }
}
</script>

<style scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-collapse-btn {
  margin-right: 20px;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  color: #303133;
  background-color: #f5f7fa;
}

.header-collapse-btn:hover {
  color: #409eff;
  background-color: #ecf5ff;
}

.header-collapse-icon {
  font-size: 18px;
}

.header-breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  margin: 0 8px;
  font-size: 14px;
  font-weight: 500;
}

.el-icon--right {
  font-size: 12px;
}
</style>
