<template>
  <div class="app-container">
    <div class="sidebar-wrapper" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
      <LayoutSidebar />
    </div>
    <div class="main-wrapper">
      <LayoutHeader />
      <LayoutTabs />
      <div class="content-wrapper">
        <LayoutContent />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LayoutHeader from './LayoutHeader.vue'
import LayoutSidebar from './LayoutSidebar.vue'
import LayoutContent from './LayoutContent.vue'
import LayoutTabs from './LayoutTabs.vue'
import { useAppStore } from '@/stores/app'

defineOptions({ name: 'AdminLayout' })

const appStore = useAppStore()
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar-wrapper {
  flex: 0 0 200px;
  width: 200px;
  overflow: hidden;
  transition:
    width 0.3s ease,
    flex-basis 0.3s ease;
}

.sidebar-collapsed {
  flex-basis: 64px;
  width: 64px;
}

.main-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  background-color: #f5f7fa;
}
</style>
