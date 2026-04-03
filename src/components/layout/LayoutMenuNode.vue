<template>
  <el-sub-menu v-if="hasChildren" :index="node.path || String(node.id)">
    <template #title>
      <el-icon><component :is="iconName" /></el-icon>
      <span>{{ node.name }}</span>
    </template>
    <LayoutMenuNode v-for="child in node.children" :key="child.id" :node="child" />
  </el-sub-menu>

  <el-menu-item v-else :index="node.path || String(node.id)">
    <el-icon><component :is="iconName" /></el-icon>
    <span>{{ node.name }}</span>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResourceTreeNode } from '@/types/upms'

defineOptions({
  name: 'LayoutMenuNode',
})

const props = defineProps<{
  node: ResourceTreeNode
}>()

const BACKEND_ICON_MAP: Record<string, string> = {
  system: 'Setting',
  user: 'User',
  peoples: 'Avatar',
  'tree-table': 'Menu',
  tree: 'OfficeBuilding',
  post: 'Briefcase',
  dict: 'Collection',
  log: 'Document',
  monitor: 'Monitor',
  dashboard: 'Odometer',
  menu: 'Grid',
  tool: 'Tools',
  link: 'Link',
  file: 'Document',
  folder: 'Folder',
  message: 'ChatDotRound',
  notification: 'Bell',
}

const hasChildren = computed(() => Boolean(props.node.children?.length))
const iconName = computed(() => {
  const rawIcon = props.node.icon || ''
  return BACKEND_ICON_MAP[rawIcon] || rawIcon || 'Menu'
})
</script>
