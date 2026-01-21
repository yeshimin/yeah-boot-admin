<template>
  <aside class="sidebar-container">
    <div class="sidebar-logo">
      <h1>管理后台</h1>
    </div>
    <el-scrollbar height="100%">
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapse"
        router
        :unique-opened="true"
      >
        <el-sub-menu index="system" v-for="menu in menuList" :key="menu.index">
          <template #title>
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </template>
          <el-menu-item
            v-for="subMenu in menu.children" :key="subMenu.index"
            :index="subMenu.path"
          >
            <el-icon><component :is="subMenu.icon" /></el-icon>
            <span>{{ subMenu.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import { Setting, User, UserFilled, Menu, OfficeBuilding, Position, Briefcase } from '@element-plus/icons-vue'

const route = useRoute()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 菜单数据
const menuList = ref([
  {
    index: 'system',
    title: '系统管理',
    icon: markRaw(Setting),
    children: [
      {
        index: 'user',
        title: '用户管理',
        path: '/system/user',
        icon: markRaw(User)
      },
      {
        index: 'role',
        title: '角色管理',
        path: '/system/role',
        icon: markRaw(UserFilled)
      },
      {
        index: 'resource',
        title: '资源管理',
        path: '/system/resource',
        icon: markRaw(Menu)
      },
      {
        index: 'org',
        title: '组织架构',
        path: '/system/org',
        icon: markRaw(OfficeBuilding)
      },
      {
        index: 'position',
        title: '岗位管理',
        path: '/system/position',
        icon: markRaw(Position)
      }
    ]
  }
])
</script>

<style scoped>
.sidebar-container {
  width: 200px;
  height: 100vh;
  background-color: #001529;
  color: #fff;
  transition: all 0.3s ease;
  overflow: hidden;
}

.sidebar-container :deep(.el-menu) {
  background-color: #001529;
  border-right: none;
}

.sidebar-container :deep(.el-menu-item),
.sidebar-container :deep(.el-sub-menu__title) {
  color: #fff;
  height: 56px;
  line-height: 56px;
}

.sidebar-container :deep(.el-menu-item:hover),
.sidebar-container :deep(.el-sub-menu__title:hover) {
  background-color: #1890ff;
}

.sidebar-container :deep(.el-menu-item.is-active) {
  background-color: #1890ff;
  color: #fff;
}

.sidebar-container :deep(.el-menu-item:not(.is-active)):hover,
.sidebar-container :deep(.el-sub-menu__title:not(.is-active)):hover {
  background-color: #1890ff;
}

.sidebar-container :deep(.el-icon) {
  color: #fff;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1f2d3d;
}

.sidebar-logo h1 {
  font-size: 18px;
  margin: 0;
  color: #fff;
}

.sidebar-menu {
  height: calc(100vh - 60px);
}
</style>
