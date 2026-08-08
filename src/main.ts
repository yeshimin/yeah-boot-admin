import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { registerUnauthorizedHandler } from '@/utils/session'

import './assets/main.css'

const app = createApp(App)

// 注册 Element Plus
app.use(ElementPlus, {
  locale: zhCn,
})

// 注册 Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore(pinia)

registerUnauthorizedHandler(async (message) => {
  const currentRoute = router.currentRoute.value
  const redirect = currentRoute.fullPath

  await authStore.clearAuth()

  if (currentRoute.path !== '/login') {
    await router.replace({
      path: '/login',
      query: redirect && redirect !== '/' ? { redirect } : undefined,
    })
  }

  ElMessage.error(message || '登录状态已失效，请重新登录')
})

app.mount('#app')
