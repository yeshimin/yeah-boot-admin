<template>
  <div class="app-container">
    <div class="sidebar-wrapper" :class="{ 'sidebar-collapsed': collapsed }">
      <LayoutSidebar />
    </div>
    <div class="main-wrapper">
      <LayoutHeader />
      <div class="content-wrapper">
        <LayoutContent />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LayoutHeader from './LayoutHeader.vue'
import LayoutSidebar from './LayoutSidebar.vue'
import LayoutContent from './LayoutContent.vue'

// 侧边栏折叠状态
const collapsed = ref(false)

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar-wrapper {
  transition: all 0.3s ease;
}

.sidebar-collapsed {
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
