import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCaptcha as getCaptchaApi, login as loginApi, logout as logoutApi } from '@/api/auth'
import { getMine, getMineResources } from '@/api/upms'
import type { CaptchaVo, LoginRequest, MineVo, ResourceTreeNode } from '@/types/upms'
import { getToken, removeToken, setToken } from '@/utils/auth'
import { useAppStore } from './app'

const MENU_ROUTE_MAP: Record<string, string> = {
  '/system/user': '/system/user',
  '/system/role': '/system/role',
  '/system/menu': '/system/resource',
  '/system/dept': '/system/org',
  '/system/post': '/system/position',
  '/system/dict': '/system/dict',
  '/system/log': '/system/log',
}

function toAbsolutePath(parentPath: string | undefined, path: string | undefined) {
  if (!path) {
    return ''
  }
  if (path.startsWith('/')) {
    return path
  }
  if (!parentPath) {
    return `/${path}`.replace(/\/+/g, '/')
  }
  return `${parentPath}/${path}`.replace(/\/+/g, '/')
}

function normalizeMenuTree(resources: ResourceTreeNode[], parentPath?: string): ResourceTreeNode[] {
  return resources
    .filter((item) => item.visible !== false && item.type <= 2)
    .map((item) => {
      const absolutePath = toAbsolutePath(parentPath, item.path)
      const normalizedPath = item.type === 1 ? absolutePath : (MENU_ROUTE_MAP[absolutePath] || absolutePath)
      const normalizedName = absolutePath === '/system/dept' ? '组织管理' : item.name
      const children = item.children ? normalizeMenuTree(item.children, absolutePath) : []
      return {
        ...item,
        name: normalizedName,
        path: normalizedPath,
        children,
      }
    })
    .filter((item) => item.checked === true || (item.children?.length ?? 0) > 0)
    .filter((item) => Boolean(item.path) || (item.children?.length ?? 0) > 0)
    .sort((left, right) => (left.sort || 0) - (right.sort || 0))
}

function normalizeResourceTree(resources: ResourceTreeNode[], parentPath?: string): ResourceTreeNode[] {
  return resources.map((item) => {
    const absolutePath = toAbsolutePath(parentPath, item.path)
    const normalizedPath = item.type === 1 ? absolutePath : (MENU_ROUTE_MAP[absolutePath] || absolutePath)
    return {
      ...item,
      path: normalizedPath,
      children: item.children ? normalizeResourceTree(item.children, absolutePath) : [],
    }
  })
}

function collectAccessiblePaths(resources: ResourceTreeNode[]): string[] {
  const paths: string[] = []

  const walk = (nodes: ResourceTreeNode[]) => {
    nodes.forEach((node) => {
      const hasChildren = Boolean(node.children?.length)
      if (!hasChildren && node.path) {
        paths.push(node.path)
      }
      if (node.children?.length) {
        walk(node.children)
      }
    })
  }

  walk(resources)
  return paths
}

function findFirstLeafPath(resources: ResourceTreeNode[]): string {
  for (const node of resources) {
    if (node.children?.length) {
      const childPath = findFirstLeafPath(node.children)
      if (childPath) {
        return childPath
      }
    }
    if (node.path) {
      return node.path
    }
  }
  return ''
}

function collectPermissionSet(resources: ResourceTreeNode[], bucket = new Set<string>()) {
  resources.forEach((node) => {
    if (node.checked === true && node.permission) {
      bucket.add(node.permission)
    }
    if (node.children?.length) {
      collectPermissionSet(node.children, bucket)
    }
  })
  return bucket
}

function findNodeByPath(resources: ResourceTreeNode[], path: string): ResourceTreeNode | null {
  for (const node of resources) {
    if (node.path === path) {
      return node
    }
    if (node.children?.length) {
      const found = findNodeByPath(node.children, path)
      if (found) {
        return found
      }
    }
  }
  return null
}

function collectDescendantActionNodes(node: ResourceTreeNode): ResourceTreeNode[] {
  const actions: ResourceTreeNode[] = []

  const walk = (children?: ResourceTreeNode[]) => {
    children?.forEach((child) => {
      if (child.type >= 3) {
        actions.push(child)
      }
      if (child.children?.length) {
        walk(child.children)
      }
    })
  }

  walk(node.children)
  return actions
}

let bootstrapPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  const appStore = useAppStore()
  const token = ref(getToken())
  const mine = ref<MineVo | null>(null)
  const permissions = ref<string[]>([])
  const resources = ref<ResourceTreeNode[]>([])
  const initialized = ref(false)

  const normalizedResources = computed(() => normalizeResourceTree(resources.value))
  const displayName = computed(() => mine.value?.user?.nickname || mine.value?.user?.username || '未登录')
  const sidebarMenus = computed(() => normalizeMenuTree(resources.value))
  const accessiblePaths = computed(() => new Set(collectAccessiblePaths(sidebarMenus.value)))
  const permissionSet = computed(() => {
    const set = collectPermissionSet(normalizedResources.value)
    permissions.value
      .filter((permission) => permission && permission !== '*:*:*')
      .forEach((permission) => set.add(permission))
    return set
  })
  const firstAccessiblePath = computed(() => findFirstLeafPath(sidebarMenus.value) || '/404')

  async function refreshCaptcha() {
    const response = await getCaptchaApi()
    return response.data as CaptchaVo
  }

  async function login(payload: LoginRequest) {
    const response = await loginApi(payload)
    const nextToken = response.data.token

    setToken(nextToken)
    token.value = nextToken
    initialized.value = false
  }

  function assignAuthContext(mineData: MineVo, resourceTree: ResourceTreeNode[]) {
    mine.value = mineData
    permissions.value = mineData.permissions || []
    resources.value = resourceTree || []
    initialized.value = true
  }

  function fetchAuthContext() {
    return Promise.all([getMine(), getMineResources()]).then(([mineResponse, resourceResponse]) => {
      assignAuthContext(mineResponse.data, resourceResponse.data || [])
    })
  }

  async function bootstrap() {
    if (!token.value) {
      return
    }

    if (initialized.value) {
      return
    }

    if (!bootstrapPromise) {
      const currentPromise = fetchAuthContext().finally(() => {
        if (bootstrapPromise === currentPromise) {
          bootstrapPromise = null
        }
      })
      bootstrapPromise = currentPromise
    }

    await bootstrapPromise
  }

  async function refreshProfile() {
    if (!token.value) {
      return
    }

    await fetchAuthContext()
  }

  async function clearAuth() {
    token.value = ''
    mine.value = null
    permissions.value = []
    resources.value = []
    initialized.value = false
    appStore.clearPageTags()
    removeToken()
  }

  async function logout() {
    try {
      if (token.value) {
        await logoutApi()
      }
    } finally {
      await clearAuth()
    }
  }

  function canAccessPath(path: string) {
    return accessiblePaths.value.has(path)
  }

  function hasPermission(permission?: string) {
    if (!permission) {
      return true
    }
    return permissionSet.value.has(permission)
  }

  function canAction(
    pagePath: string,
    options: {
      names?: string[]
      permissions?: string[]
    },
  ) {
    if (!canAccessPath(pagePath)) {
      return false
    }

    const pageNode = findNodeByPath(normalizedResources.value, pagePath)
    if (!pageNode) {
      return false
    }

    const actionNodes = collectDescendantActionNodes(pageNode)
    const matchedByPermission = options.permissions?.some((permission) => hasPermission(permission))
    if (matchedByPermission) {
      return true
    }

    const matchedByActionNode = actionNodes.some((node) => {
      if (node.checked !== true) {
        return false
      }
      const matchesName = options.names?.includes(node.name)
      const matchesPermission = node.permission ? options.permissions?.includes(node.permission) : false
      return Boolean(matchesName || matchesPermission)
    })

    if (matchedByActionNode) {
      return true
    }

    // 如果该页面下尚未配置按钮级资源，则默认继承页面权限，避免把所有按钮都误隐藏。
    return actionNodes.length === 0
  }

  return {
    token,
    mine,
    permissions,
    resources,
    initialized,
    displayName,
    sidebarMenus,
    firstAccessiblePath,
    permissionSet,
    refreshCaptcha,
    login,
    bootstrap,
    refreshProfile,
    canAccessPath,
    hasPermission,
    canAction,
    clearAuth,
    logout,
  }
})
