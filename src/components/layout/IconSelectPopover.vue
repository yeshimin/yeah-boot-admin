<template>
  <div class="icon-select-popover">
    <div
      v-for="icon in icons"
      :key="icon"
      class="icon-item"
      :class="{ active: icon === modelValue }"
      @click="$emit('update:modelValue', icon)"
    >
      <el-icon><component :is="icon" /></el-icon>
      <span>{{ icon }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  icons: string[]
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.icon-select-popover {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  color: #374151;
  transition: all 0.2s ease;
}

.icon-item:hover,
.icon-item.active {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

.icon-item span {
  font-size: 12px;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
}
</style>
