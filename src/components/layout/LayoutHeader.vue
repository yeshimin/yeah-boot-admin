<template>
  <header class="header-container">
    <div class="header-left">
      <el-button
        type="text"
        icon="Menu"
        class="header-collapse-btn"
        @click="toggleSidebar"
      ></el-button>
      <el-breadcrumb class="header-breadcrumb">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbList"
          :key="index"
          :to="item?.path"
          v-if="item && item.path"
        >
          {{ item.title }}
        </el-breadcrumb-item>
        <el-breadcrumb-item v-else-if="item">{{ item.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userInfo.avatar || defaultAvatar"></el-avatar>
          <span class="user-name">{{ userInfo.name }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowDown, User, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 用户信息
const userInfo = ref({
  id: '1',
  name: '管理员',
  username: 'admin',
  email: 'admin@example.com',
  phone: '13800138000',
  avatar: '',
  role: '管理员',
  dept: '技术部',
  status: 1
})

// 动态计算面包屑
const breadcrumbList = computed(() => {
  const matched = route.matched || []
  const breadcrumbs = []

  // 添加首页
  breadcrumbs.push({
    title: '首页',
    path: '/'
  })

  // 遍历匹配的路由
  for (const routeItem of matched) {
    if (routeItem?.meta?.title && routeItem?.path) {
      breadcrumbs.push({
        title: routeItem.meta.title as string,
        path: routeItem.path
      })
    }
  }

  return breadcrumbs
})

// 监听路由变化，更新面包屑
watch(
  () => route.path,
  () => {
    // 路由变化时，面包屑会自动更新
  }
)

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  // 此处可以通过 Pinia 或 Event Bus 传递折叠状态
  console.log('Toggle sidebar')
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能待实现')
      break
    case 'settings':
      ElMessage.info('设置功能待实现')
      break
    case 'logout':
      // 退出登录逻辑
      localStorage.removeItem('token')
      router.push('/login')
      ElMessage.success('退出登录成功')
      break
  }
}
</script>

<style scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-collapse-btn {
  margin-right: 20px;
  font-size: 20px;
}

.header-breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  margin: 0 8px;
  font-size: 14px;
  font-weight: 500;
}

.el-icon--right {
  font-size: 12px;
}
</style>
