import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface PageTag {
  title: string
  path: string
}

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const pageTags = ref<PageTag[]>([])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addPageTag(tag: PageTag) {
    if (!tag.path || !tag.title) {
      return
    }
    if (pageTags.value.some((item) => item.path === tag.path)) {
      return
    }
    pageTags.value.push(tag)
  }

  function removePageTag(path: string) {
    pageTags.value = pageTags.value.filter((item) => item.path !== path)
  }

  function clearPageTags() {
    pageTags.value = []
  }

  return {
    sidebarCollapsed,
    pageTags,
    toggleSidebar,
    addPageTag,
    removePageTag,
    clearPageTags,
  }
})
