<template>
  <aside class="sidebar-container" :class="{ 'is-collapsed': isCollapse }">
    <div class="sidebar-logo" role="button" tabindex="0" @click="openHome" @keydown.enter="openHome">
      <h1>管理后台</h1>
    </div>
    <el-scrollbar height="100%">
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapse"
        :unique-opened="true"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/home">
          <el-icon><House /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <LayoutMenuNode v-for="menu in menuList" :key="menu.id" :node="menu" />
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House } from '@element-plus/icons-vue'
import LayoutMenuNode from './LayoutMenuNode.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import type { ResourceTreeNode } from '@/types/upms'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

const isCollapse = computed(() => appStore.sidebarCollapsed)
const menuList = computed(() => authStore.sidebarMenus)

function findMenuNode(nodes: ResourceTreeNode[], index: string): ResourceTreeNode | null {
  for (const node of nodes) {
    if (node.path === index || String(node.id) === index) {
      return node
    }
    if (node.children?.length) {
      const found = findMenuNode(node.children, index)
      if (found) {
        return found
      }
    }
  }
  return null
}

function resolveExternalUrl(linkUrl?: string) {
  if (!linkUrl) {
    return null
  }

  try {
    const url = new URL(linkUrl)
    return ['http:', 'https:'].includes(url.protocol) ? url : null
  } catch {
    return null
  }
}

async function handleMenuSelect(index: string) {
  if (index === '/home') {
    await openHome()
    return
  }

  const node = findMenuNode(menuList.value, index)

  if (node?.isLink) {
    const externalUrl = resolveExternalUrl(node.linkUrl)
    if (!externalUrl) {
      ElMessage.warning('外链地址无效，请联系管理员检查菜单配置')
      return
    }

    window.open(externalUrl.href, '_blank', 'noopener,noreferrer')
    return
  }

  if (!node?.path) {
    ElMessage.warning('菜单路径未配置')
    return
  }

  if (node.path !== route.path) {
    await router.push(node.path)
  }
}

async function openHome() {
  if (route.path !== '/home') {
    await router.push('/home')
  }
}
</script>

<style scoped>
.sidebar-container {
  width: 100%;
  height: 100vh;
  background-color: #001529;
  color: #fff;
  overflow: hidden;
}

.sidebar-container :deep(.el-menu) {
  background-color: #001529;
  border-right: none;
}

.sidebar-container :deep(.el-menu-item),
.sidebar-container :deep(.el-sub-menu__title) {
  color: #fff;
  height: 56px;
  line-height: 56px;
}

.sidebar-container :deep(.el-menu-item:hover),
.sidebar-container :deep(.el-sub-menu__title:hover) {
  background-color: #1890ff;
}

.sidebar-container :deep(.el-menu-item.is-active) {
  background-color: #1890ff;
  color: #fff;
}

.sidebar-container :deep(.el-menu-item:not(.is-active)):hover,
.sidebar-container :deep(.el-sub-menu__title:not(.is-active)):hover {
  background-color: #1890ff;
}

.sidebar-container :deep(.el-icon) {
  color: #fff;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1f2d3d;
  cursor: pointer;
}

.sidebar-logo:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: -2px;
}

.sidebar-logo h1 {
  font-size: 18px;
  margin: 0;
  color: #fff;
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 0.15s ease,
    transform 0.3s ease;
}

.sidebar-container.is-collapsed .sidebar-logo h1 {
  opacity: 0;
  transform: translateX(-8px);
}

.sidebar-menu {
  width: 100%;
  height: calc(100vh - 60px);
  transition: width 0.3s ease;
}
</style>
