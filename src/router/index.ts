import { createRouter, createWebHistory } from 'vue-router'

// 引入 Layout 组件
const Layout = () => import('../components/layout/index.vue')

// 静态路由
const constantRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/error/404.vue'),
    meta: { title: '404' },
  },
  {
    path: '/500',
    name: '500',
    component: () => import('../views/error/500.vue'),
    meta: { title: '500' },
  },
]

// 直接导入组件
const UserManage = () => import('../views/system/UserManage.vue')
const RoleManage = () => import('../views/system/RoleManage.vue')
const ResourceManage = () => import('../views/system/ResourceManage.vue')
const OrgManage = () => import('../views/system/OrgManage.vue')
const PositionManage = () => import('../views/system/PositionManage.vue')

// 动态路由
const asyncRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '首页' },
    children: [
      // 系统管理
      {
        path: '/system/user',
        name: 'system-user',
        component: UserManage,
        meta: { title: '用户管理' },
      },
      {
        path: '/system/role',
        name: 'system-role',
        component: RoleManage,
        meta: { title: '角色管理' },
      },
      {
        path: '/system/resource',
        name: 'system-resource',
        component: ResourceManage,
        meta: { title: '资源管理' },
      },
      {
        path: '/system/org',
        name: 'system-org',
        component: OrgManage,
        meta: { title: '组织架构' },
      },
      {
        path: '/system/position',
        name: 'system-position',
        component: PositionManage,
        meta: { title: '岗位管理' },
      },
    ],
  },
  // 404 必须放在最后
  { path: '/:pathMatch(.*)*', redirect: '/404', hidden: true },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...constantRoutes, ...asyncRoutes],
})

// 路由守卫
router.beforeEach((to) => {
  // 设置页面标题
  document.title = `${to.meta.title || '管理后台'}`

  // 获取 token
  const token = localStorage.getItem('token')

  // 不需要登录的页面直接放行
  if (to.path === '/login') {
    return true
  }

  // 没有 token 跳转到登录页面
  if (!token) {
    return '/login'
  }

  // 有 token 放行
  return true
})

export default router
