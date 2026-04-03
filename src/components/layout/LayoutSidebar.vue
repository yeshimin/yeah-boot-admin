<template>
  <aside class="sidebar-container">
    <div class="sidebar-logo">
      <h1>管理后台</h1>
    </div>
    <el-scrollbar height="100%">
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapse"
        router
        :unique-opened="true"
      >
        <LayoutMenuNode v-for="menu in menuList" :key="menu.id" :node="menu" />
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LayoutMenuNode from './LayoutMenuNode.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

const isCollapse = computed(() => appStore.sidebarCollapsed)
const menuList = computed(() => authStore.sidebarMenus)
</script>

<style scoped>
.sidebar-container {
  width: 200px;
  height: 100vh;
  background-color: #001529;
  color: #fff;
  transition: all 0.3s ease;
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
}

.sidebar-logo h1 {
  font-size: 18px;
  margin: 0;
  color: #fff;
}

.sidebar-menu {
  height: calc(100vh - 60px);
}
</style>
