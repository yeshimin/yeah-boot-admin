<template>
  <div class="home-page">
    <section class="welcome-card">
      <div>
        <p class="welcome-date">{{ currentDate }}</p>
        <h1>{{ greeting }}，{{ authStore.displayName }}</h1>
        <p class="welcome-description">欢迎使用管理后台，你可以从下方快捷入口开始处理工作。</p>
      </div>
      <el-button type="primary" @click="openProfile">
        <el-icon><User /></el-icon>
        个人中心
      </el-button>
    </section>

    <section class="overview-grid">
      <el-card shadow="never" class="overview-card">
        <div class="overview-icon role-icon"><Key /></div>
        <div>
          <div class="overview-value">{{ roleCount }}</div>
          <div class="overview-label">当前角色</div>
        </div>
      </el-card>
      <el-card shadow="never" class="overview-card">
        <div class="overview-icon org-icon"><OfficeBuilding /></div>
        <div>
          <div class="overview-value">{{ orgCount }}</div>
          <div class="overview-label">所属组织</div>
        </div>
      </el-card>
      <el-card shadow="never" class="overview-card">
        <div class="overview-icon menu-icon"><Grid /></div>
        <div>
          <div class="overview-value">{{ accessibleEntries.length }}</div>
          <div class="overview-label">可访问模块</div>
        </div>
      </el-card>
    </section>

    <el-card shadow="never" class="quick-card">
      <template #header>
        <div class="card-header">
          <h2>快捷入口</h2>
          <p>根据当前账号拥有的菜单权限生成</p>
        </div>
      </template>

      <div v-if="quickEntries.length" class="quick-grid">
        <button
          v-for="entry in quickEntries"
          :key="entry.id"
          type="button"
          class="quick-entry"
          @click="openEntry(entry.path)"
        >
          <span>{{ entry.name }}</span>
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
      <el-empty v-else description="当前账号暂无可访问的业务菜单" :image-size="80" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Grid, Key, OfficeBuilding, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { ResourceTreeNode } from '@/types/upms'

interface QuickEntry {
  id: number
  name: string
  path: string
}

const router = useRouter()
const authStore = useAuthStore()

const currentDate = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) {
    return '夜深了'
  }
  if (hour < 12) {
    return '上午好'
  }
  if (hour < 18) {
    return '下午好'
  }
  return '晚上好'
})

const roleCount = computed(() => authStore.mine?.roles?.length || 0)
const orgCount = computed(() => authStore.mine?.orgs?.length || 0)
const accessibleEntries = computed(() => collectQuickEntries(authStore.sidebarMenus))
const quickEntries = computed(() => accessibleEntries.value.slice(0, 8))

function collectQuickEntries(nodes: ResourceTreeNode[], entries: QuickEntry[] = []) {
  nodes.forEach((node) => {
    if (node.children?.length) {
      collectQuickEntries(node.children, entries)
      return
    }
    if (!node.isLink && node.path) {
      entries.push({
        id: node.id,
        name: node.name,
        path: node.path,
      })
    }
  })
  return entries
}

function openProfile() {
  router.push('/profile')
}

function openEntry(path: string) {
  router.push(path)
}
</script>

<style scoped>
.home-page {
  min-height: 100%;
  padding: 24px;
}

.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px;
  border: 1px solid #d9ecff;
  border-radius: 12px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 65%, #fff 100%);
}

.welcome-date {
  margin: 0 0 10px;
  color: #409eff;
  font-size: 14px;
}

.welcome-card h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
  line-height: 1.4;
}

.welcome-description {
  margin: 10px 0 0;
  color: #606266;
  line-height: 1.6;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.overview-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
}

.overview-icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 24px;
}

.role-icon {
  color: #409eff;
  background-color: #ecf5ff;
}

.org-icon {
  color: #67c23a;
  background-color: #f0f9eb;
}

.menu-icon {
  color: #e6a23c;
  background-color: #fdf6ec;
}

.overview-value {
  color: #303133;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}

.overview-label {
  margin-top: 6px;
  color: #909399;
  font-size: 14px;
}

.quick-card {
  margin-top: 20px;
}

.card-header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.card-header p {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.quick-entry {
  display: flex;
  min-width: 0;
  height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.quick-entry span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-entry:hover {
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(64 158 255 / 12%);
}

@media (max-width: 960px) {
  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .home-page {
    padding: 16px;
  }

  .welcome-card {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }

  .overview-grid,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
