<template>
  <div class="tabs-container" v-if="pageTags.length">
    <el-scrollbar class="tabs-scrollbar">
      <div class="tabs-track">
        <div
          v-for="tag in pageTags"
          :key="tag.path"
          class="tab-item"
          :class="{ active: tag.path === route.path }"
          @click="openTag(tag.path)"
          @contextmenu.prevent.stop="openContextMenu($event, tag.path)"
        >
          <span class="tab-title">{{ tag.title }}</span>
          <button
            type="button"
            class="tab-close"
            title="关闭标签"
            @click.stop="closeTag(tag.path)"
          >
            ×
          </button>
        </div>
      </div>
    </el-scrollbar>
    <el-dropdown trigger="click" @command="handleTabsCommand">
      <button type="button" class="tabs-actions" title="页签操作">
        <el-icon><MoreFilled /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="current">关闭当前</el-dropdown-item>
          <el-dropdown-item command="others">关闭其他</el-dropdown-item>
          <el-dropdown-item command="all" divided>关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="tab-context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <button type="button" @click="handleContextMenuCommand('current')">关闭当前</button>
        <button type="button" @click="handleContextMenuCommand('others')">关闭其他</button>
        <button type="button" class="is-divided" @click="handleContextMenuCommand('all')">
          关闭全部
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MoreFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

type TabsCommand = 'current' | 'others' | 'all'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  targetPath: '',
})

const pageTags = computed(() => appStore.pageTags)

watch(
  () => [route.path, route.meta.title] as const,
  ([path, title]) => {
    if (!title || ['/login', '/404', '/500'].includes(path)) {
      return
    }
    appStore.addPageTag({
      title: String(title),
      path,
    })
  },
  { immediate: true },
)

function openTag(path: string) {
  if (path === route.path) {
    return
  }
  router.push(path)
}

function closeTag(path: string) {
  const currentIndex = pageTags.value.findIndex((item) => item.path === path)
  const isActive = route.path === path
  appStore.removePageTag(path)

  if (!isActive) {
    return
  }

  const nextTag = pageTags.value[currentIndex] || pageTags.value[currentIndex - 1]
  navigateAfterClose(nextTag?.path)
}

function navigateAfterClose(preferredPath?: string) {
  const targetPath = preferredPath || authStore.firstAccessiblePath || '/404'
  if (targetPath !== route.path) {
    router.push(targetPath)
    return
  }

  if (route.meta.title) {
    appStore.addPageTag({
      title: String(route.meta.title),
      path: route.path,
    })
  }
}

function handleTabsCommand(command: TabsCommand, targetPath = route.path) {
  if (command === 'current') {
    closeTag(targetPath)
    return
  }

  if (command === 'others') {
    appStore.removeOtherPageTags(targetPath)
    if (route.path !== targetPath) {
      router.push(targetPath)
    }
    return
  }

  appStore.clearPageTags()
  navigateAfterClose()
}

function openContextMenu(event: MouseEvent, path: string) {
  const menuWidth = 128
  const menuHeight = 112
  contextMenu.x = Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8))
  contextMenu.y = Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8))
  contextMenu.targetPath = path
  contextMenu.visible = true
}

function closeContextMenu() {
  contextMenu.visible = false
}

function handleContextMenuCommand(command: TabsCommand) {
  const targetPath = contextMenu.targetPath
  closeContextMenu()
  handleTabsCommand(command, targetPath)
}

onMounted(() => {
  document.addEventListener('click', closeContextMenu)
  window.addEventListener('resize', closeContextMenu)
  window.addEventListener('scroll', closeContextMenu, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu)
  window.removeEventListener('resize', closeContextMenu)
  window.removeEventListener('scroll', closeContextMenu, true)
})
</script>

<style scoped>
.tabs-container {
  display: flex;
  align-items: stretch;
  height: 42px;
  overflow: hidden;
  border-bottom: 1px solid #ebeef5;
  background-color: #fff;
}

.tabs-scrollbar {
  flex: 1;
  min-width: 0;
}

.tabs-track {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: max-content;
  padding: 6px 16px;
}

.tabs-container :deep(.el-scrollbar__wrap) {
  overflow-x: auto;
  overflow-y: hidden;
}

.tabs-container :deep(.el-scrollbar__bar.is-vertical) {
  display: none;
}

.tabs-actions {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-left: 1px solid #ebeef5;
  background: #fff;
  color: #606266;
  cursor: pointer;
}

.tabs-actions:hover {
  color: #409eff;
  background-color: #f5f7fa;
}

.tab-context-menu {
  position: fixed;
  z-index: 3000;
  display: flex;
  width: 128px;
  flex-direction: column;
  padding: 5px 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgb(0 0 0 / 12%);
}

.tab-context-menu button {
  width: 100%;
  height: 32px;
  padding: 0 16px;
  border: none;
  background: transparent;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}

.tab-context-menu button:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.tab-context-menu button.is-divided {
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 0;
  background-color: transparent;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-item:hover {
  color: #409eff;
  border-color: #a0cfff;
  background-color: transparent;
}

.tab-item.active {
  color: #409eff;
  border-color: #409eff;
  background-color: transparent;
}

.tab-title {
  white-space: nowrap;
  font-size: 13px;
}

.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  line-height: 1;
}

.tab-close:hover {
  color: #f56c6c;
}
</style>
