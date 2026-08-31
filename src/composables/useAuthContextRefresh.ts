import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function useAuthContextRefresh() {
  const authStore = useAuthStore()
  const route = useRoute()
  const router = useRouter()

  return async function refreshAuthContextSilently() {
    try {
      await authStore.refreshProfile()
      if (!authStore.canAccessPath(route.path)) {
        await router.replace(authStore.firstAccessiblePath)
      }
    } catch {
      // 刷新失败不影响当前管理操作，后续请求仍由后端实时鉴权兜底。
    }
  }
}
