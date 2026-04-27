import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ResourceTreeNode } from '@/types/upms'

// 引入 Layout 组件
const Layout = () => import('../components/layout/index.vue')
const RoutePlaceholderView = () => import('../views/system/RoutePlaceholderView.vue')

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
const DictManage = () => import('../views/system/DictManage.vue')
const LogManage = () => import('../views/system/LogManage.vue')
const AreaManage = () => import('../views/system/AreaManage.vue')
const ProfileView = () => import('../views/profile/ProfileView.vue')
const backendViewModules = import.meta.glob('../views/**/*.vue')
const registeredDynamicRouteNames = new Set<string>()

const BACKEND_COMPONENT_MAP: Record<string, () => Promise<unknown>> = {
  'system/user/index': UserManage,
  'system/role/index': RoleManage,
  'system/menu/index': ResourceManage,
  'system/dept/index': OrgManage,
  'system/post/index': PositionManage,
  'system/dict/index': DictManage,
  'system/log/index': LogManage,
  'system/area/index': AreaManage,
  'area/index': AreaManage,
  'area/province/index': AreaManage,
  'area/city/index': AreaManage,
}

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
        path: '/profile',
        name: 'profile',
        component: ProfileView,
        meta: {
          title: '个人中心',
          ignoreAccessControl: true,
        },
      },
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
        meta: { title: '组织管理' },
      },
      {
        path: '/system/position',
        name: 'system-position',
        component: PositionManage,
        meta: { title: '岗位管理' },
      },
      {
        path: '/system/dict',
        name: 'system-dict',
        component: DictManage,
        meta: { title: '字典管理' },
      },
      {
        path: '/system/area',
        name: 'system-area',
        component: AreaManage,
        meta: { title: '地区管理' },
      },
      {
        path: '/system/log',
        name: 'system-log',
        component: LogManage,
        meta: { title: '系统日志' },
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

function resolveBackendView(component?: string) {
  if (!component || component === 'Layout') {
    return RoutePlaceholderView
  }

  if (BACKEND_COMPONENT_MAP[component]) {
    return BACKEND_COMPONENT_MAP[component]
  }

  const directPath = `../views/${component}.vue`
  const indexPath = `../views/${component}/index.vue`

  if (backendViewModules[directPath]) {
    return backendViewModules[directPath]
  }

  if (backendViewModules[indexPath]) {
    return backendViewModules[indexPath]
  }

  return RoutePlaceholderView
}

function buildDynamicRouteNode(node: ResourceTreeNode): RouteRecordRaw {
  const routeName = `dynamic-${node.id}`
  const hasChildren = Boolean(node.children?.length)

  if (hasChildren) {
    const children = (node.children || []).map((child) => buildDynamicRouteNode(child)).map((child) => ({
      ...child,
      path: String(child.path).replace(`${node.path}/`, ''),
    }))

    const firstChild = node.children?.find((child) => child.path)?.path

    return {
      path: node.path || `/${node.id}`,
      name: routeName,
      component: Layout,
      redirect: firstChild,
      meta: {
        title: node.name,
        icon: node.icon,
        backendComponent: node.component,
      },
      children,
    }
  }

  return {
    path: node.path || `/${node.id}`,
    name: routeName,
    component: resolveBackendView(node.component),
    meta: {
      title: node.name,
      icon: node.icon,
      backendComponent: node.component,
    },
  }
}

function ensureDynamicRoutes(resources: ResourceTreeNode[]) {
  const dynamicMenus = resources.filter((item) => !item.path?.startsWith('/system'))
  dynamicMenus.forEach((node) => {
    const route = buildDynamicRouteNode(node)
    if (route.name && !registeredDynamicRouteNames.has(String(route.name))) {
      router.addRoute(route)
      registeredDynamicRouteNames.add(String(route.name))
    }
  })
}

// 路由守卫
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 设置页面标题
  document.title = `${to.meta.title || '管理后台'}`

  // 不需要登录的页面直接放行
  if (to.path === '/login') {
    if (authStore.token) {
      return '/'
    }
    return true
  }

  // 没有 token 跳转到登录页面
  if (!authStore.token) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  try {
    await authStore.bootstrap()
    ensureDynamicRoutes(authStore.sidebarMenus)
  } catch {
    await authStore.clearAuth()
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  const hasConcreteRoute = router.getRoutes().some((route) => route.path === to.path)
  const matchedConcreteRoute = to.matched.some((record) => record.path === to.path)
  if (hasConcreteRoute && !matchedConcreteRoute) {
    return {
      path: to.fullPath,
      replace: true,
    }
  }

  const ignoreAccessControl = to.matched.some((record) => record.meta?.ignoreAccessControl === true)
  if (
    !ignoreAccessControl &&
    !['/', '/login', '/404', '/500'].includes(to.path) &&
    !authStore.canAccessPath(to.path)
  ) {
    return authStore.firstAccessiblePath
  }

  // 有 token 放行
  return true
})

export default router
