import type { PageResponse } from '@/types/api'
import type {
  MineVo,
  ResourceTreeNode,
  SysDictEntity,
  SysDictTreeNode,
  SysLogEntity,
  SysOrgEntity,
  SysOrgTreeNode,
  SysPostEntity,
  SysResEntity,
  SysResGroupEntity,
  SysResGroupTreeNode,
  SysResMountEntity,
  SysResMountItem,
  SysRoleEntity,
  SysRoleVo,
  UpdateMineRequest,
  SysUserVo,
} from '@/types/upms'
import { request } from '@/utils/request'

export function getMine() {
  return request<MineVo>({
    url: '/admin/sysUser/mine',
    method: 'get',
  })
}

export function getMineResources() {
  return request<ResourceTreeNode[]>({
    url: '/admin/sysUser/mineResources',
    method: 'get',
  })
}

export function updateMine(data: UpdateMineRequest) {
  return request<void>({
    url: '/admin/sysUser/updateMine',
    method: 'post',
    data,
  })
}

export function queryUsers(params: Record<string, unknown>) {
  return request<PageResponse<SysUserVo>>({
    url: '/admin/sysUser/query',
    method: 'get',
    params,
  })
}

export function getUserDetail(id: number) {
  return request<SysUserVo>({
    url: '/admin/sysUser/detail',
    method: 'get',
    params: { id },
  })
}

export function createUser(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysUser/create',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function updateUser(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysUser/update',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function deleteUsers(ids: number[], options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysUser/delete',
    method: 'post',
    data: { ids },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function queryRoles(params: Record<string, unknown>) {
  return request<PageResponse<SysRoleEntity>>({
    url: '/admin/sysRole/crud/query',
    method: 'get',
    params,
  })
}

export function getRoleDetail(id: number) {
  return request<SysRoleVo>({
    url: '/admin/sysRole/detail',
    method: 'get',
    params: { id },
  })
}

export function createRole(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysRole/create',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function updateRole(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysRole/update',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function deleteRoles(ids: number[], options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysRole/delete',
    method: 'post',
    data: { ids },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function queryResources(params: Record<string, unknown>) {
  return request<PageResponse<SysResEntity>>({
    url: '/admin/sysRes/crud/query',
    method: 'get',
    params,
  })
}

export function getResourceTree(params?: Record<string, unknown>) {
  return request<ResourceTreeNode[]>({
    url: '/admin/sysRes/tree',
    method: 'get',
    params,
  })
}

export function getViewResourceTree(params?: Record<string, unknown>) {
  return request<ResourceTreeNode[]>({
    url: '/admin/sysRes/viewTree',
    method: 'get',
    params,
  })
}

export function getApiResourceTree(params?: Record<string, unknown>) {
  return request<ResourceTreeNode[]>({
    url: '/admin/sysRes/apiTree',
    method: 'get',
    params,
  })
}

export function getResourceDetail(id: number) {
  return request<SysResEntity>({
    url: '/admin/sysRes/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createResource(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysRes/create',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function updateResource(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysRes/update',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function deleteResources(ids: number[], options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysRes/delete',
    method: 'post',
    data: { ids },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function getResourceGroupTree() {
  return request<SysResGroupTreeNode[]>({
    url: '/admin/sysResGroup/tree',
    method: 'get',
  })
}

export function createResourceGroup(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<SysResGroupEntity>({
    url: '/admin/sysResGroup/create',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function updateResourceGroup(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<SysResGroupEntity>({
    url: '/admin/sysResGroup/update',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function deleteResourceGroups(ids: number[], options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysResGroup/delete',
    method: 'post',
    data: { ids },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function queryMountedApis(viewResId: number) {
  return request<SysResMountEntity[]>({
    url: '/admin/sysResMount/queryByViewResId',
    method: 'get',
    params: { viewResId },
  })
}

export function saveMountedApis(
  viewResId: number,
  items: SysResMountItem[],
  options?: { suppressErrorMessage?: boolean },
) {
  return request<boolean>({
    url: '/admin/sysResMount/saveByViewResId',
    method: 'post',
    data: { viewResId, items },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function queryPosts(params: Record<string, unknown>) {
  return request<PageResponse<SysPostEntity>>({
    url: '/admin/sysPost/crud/query',
    method: 'get',
    params,
  })
}

export function getPostDetail(id: number) {
  return request<SysPostEntity>({
    url: '/admin/sysPost/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createPost(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysPost/create',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function updatePost(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysPost/update',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function deletePosts(ids: number[], options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysPost/delete',
    method: 'post',
    data: { ids },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function queryRoleResourceTree(roleId: number) {
  return request<ResourceTreeNode[]>({
    url: '/admin/sysRole/queryResourceTree',
    method: 'get',
    params: { roleId },
  })
}

export function setRoleResources(
  roleId: number,
  viewResIds: number[],
  mountIds: number[] = [],
  options?: { suppressErrorMessage?: boolean },
) {
  return request<void>({
    url: '/admin/sysRole/setResources',
    method: 'post',
    data: { roleId, viewResIds, mountIds },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function getOrgTree(params?: Record<string, unknown>) {
  return request<SysOrgTreeNode[]>({
    url: '/admin/sysOrg/tree',
    method: 'get',
    params,
  })
}

export function getOrgDetail(id: number) {
  return request<SysOrgEntity>({
    url: '/admin/sysOrg/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createOrg(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysOrg/create',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function updateOrg(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysOrg/update',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function deleteOrgs(ids: number[], options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysOrg/delete',
    method: 'post',
    data: { ids },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function queryDicts(params: Record<string, unknown>) {
  return request<PageResponse<SysDictEntity>>({
    url: '/admin/sysDict/crud/query',
    method: 'get',
    params,
  })
}

export function getDictTree(rootNodeCode?: string) {
  return request<SysDictTreeNode[]>({
    url: '/admin/sysDict/tree',
    method: 'get',
    params: {
      rootNodeCode: rootNodeCode || undefined,
    },
  })
}

export function getDictDetail(id: number) {
  return request<SysDictEntity>({
    url: '/admin/sysDict/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createDict(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysDict/create',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function updateDict(data: Record<string, unknown>, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysDict/update',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function deleteDicts(ids: number[], force = false, options?: { suppressErrorMessage?: boolean }) {
  return request<void>({
    url: '/admin/sysDict/delete',
    method: 'post',
    data: { ids, force },
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

export function queryLogs(params: Record<string, unknown>) {
  return request<PageResponse<SysLogEntity>>({
    url: '/admin/sysLog/crud/query',
    method: 'get',
    params,
  })
}
