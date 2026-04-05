<template>
  <div class="tabs-container" v-if="pageTags.length">
    <el-scrollbar>
      <div class="tabs-track">
        <div
          v-for="tag in pageTags"
          :key="tag.path"
          class="tab-item"
          :class="{ active: tag.path === route.path }"
          @click="openTag(tag.path)"
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
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

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
  router.push(nextTag?.path || authStore.firstAccessiblePath || '/404')
}
</script>

<style scoped>
.tabs-container {
  height: 42px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fff;
}

.tabs-track {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: max-content;
  padding: 6px 16px;
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
