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
  SysRoleEntity,
  SysRoleVo,
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

export function createUser(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysUser/create',
    method: 'post',
    data,
  })
}

export function updateUser(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysUser/update',
    method: 'post',
    data,
  })
}

export function deleteUsers(ids: number[]) {
  return request<void>({
    url: '/admin/sysUser/delete',
    method: 'post',
    data: { ids },
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

export function createRole(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysRole/create',
    method: 'post',
    data,
  })
}

export function updateRole(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysRole/update',
    method: 'post',
    data,
  })
}

export function deleteRoles(ids: number[]) {
  return request<void>({
    url: '/admin/sysRole/delete',
    method: 'post',
    data: { ids },
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

export function getResourceDetail(id: number) {
  return request<SysResEntity>({
    url: '/admin/sysRes/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createResource(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysRes/create',
    method: 'post',
    data,
  })
}

export function updateResource(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysRes/update',
    method: 'post',
    data,
  })
}

export function deleteResources(ids: number[]) {
  return request<void>({
    url: '/admin/sysRes/delete',
    method: 'post',
    data: { ids },
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

export function createPost(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysPost/create',
    method: 'post',
    data,
  })
}

export function updatePost(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysPost/update',
    method: 'post',
    data,
  })
}

export function deletePosts(ids: number[]) {
  return request<void>({
    url: '/admin/sysPost/delete',
    method: 'post',
    data: { ids },
  })
}

export function queryRoleResourceTree(roleId: number) {
  return request<ResourceTreeNode[]>({
    url: '/admin/sysRole/queryResourceTree',
    method: 'get',
    params: { roleId },
  })
}

export function setRoleResources(roleId: number, resIds: number[]) {
  return request<void>({
    url: '/admin/sysRole/setResources',
    method: 'post',
    data: { roleId, resIds },
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

export function createOrg(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysOrg/create',
    method: 'post',
    data,
  })
}

export function updateOrg(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysOrg/update',
    method: 'post',
    data,
  })
}

export function deleteOrgs(ids: number[]) {
  return request<void>({
    url: '/admin/sysOrg/delete',
    method: 'post',
    data: { ids },
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

export function createDict(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysDict/create',
    method: 'post',
    data,
  })
}

export function updateDict(data: Record<string, unknown>) {
  return request<void>({
    url: '/admin/sysDict/update',
    method: 'post',
    data,
  })
}

export function deleteDicts(ids: number[], force = false) {
  return request<void>({
    url: '/admin/sysDict/delete',
    method: 'post',
    data: { ids, force },
  })
}

export function queryLogs(params: Record<string, unknown>) {
  return request<PageResponse<SysLogEntity>>({
    url: '/admin/sysLog/crud/query',
    method: 'get',
    params,
  })
}
