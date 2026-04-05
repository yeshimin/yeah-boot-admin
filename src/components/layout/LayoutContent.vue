<template>
  <main class="content-container">
    <router-view :key="$route.fullPath" />
  </main>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(() => route.path, () => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.content-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 0;
  background-color: transparent;
}
</style>
