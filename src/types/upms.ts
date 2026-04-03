export interface IdNameVo {
  id: number
  name: string
}

export interface LoginRequest {
  username: string
  password: string
  key?: string
  code?: string
  terminal?: 'web' | 'app' | 'api'
}

export interface LoginVo {
  token: string
  username?: string
}

export interface CaptchaVo {
  key?: string
  image?: string
  enabled?: boolean
}

export interface SysRoleEntity {
  id: number
  code?: string
  name: string
  status?: string
  remark?: string
  createTime?: string
}

export interface SysOrgEntity {
  id: number
  parentId?: number
  name: string
  status?: string
  sort?: number
  remark?: string
  createTime?: string
}

export interface SysOrgTreeNode extends SysOrgEntity {
  children?: SysOrgTreeNode[]
}

export interface SysPostEntity {
  id: number
  code?: string
  name: string
  status?: string
  sort?: number
  remark?: string
  createTime?: string
}

export interface SysUserEntity {
  id: number
  username: string
  password?: string
  status?: string
  nickname?: string
  avatar?: string
  mobile?: string
  email?: string
  gender?: string
  remark?: string
  createTime?: string
}

export interface MineVo {
  user: SysUserEntity
  roles: SysRoleEntity[]
  orgs: SysOrgEntity[]
  permissions: string[]
}

export interface ResourceTreeNode {
  id: number
  type: number
  parentId?: number
  name: string
  permission?: string
  path?: string
  component?: string
  icon?: string
  isLink?: boolean
  linkUrl?: string
  status?: string
  visible?: boolean
  sort?: number
  remark?: string
  checked?: boolean
  children?: ResourceTreeNode[]
}

export interface SysResEntity extends Omit<ResourceTreeNode, 'children' | 'checked'> {
  createTime?: string
}

export interface SysUserVo extends SysUserEntity {
  posts?: IdNameVo[]
  orgs?: IdNameVo[]
  roles?: IdNameVo[]
}

export interface SysRoleVo extends SysRoleEntity {
  resources?: IdNameVo[]
}

export interface SysDictEntity {
  id: number
  parentId?: number
  code?: string
  name: string
  value?: string
  level?: number
  path?: string
  sort?: number
  remark?: string
  createTime?: string
}

export interface SysDictTreeNode extends SysDictEntity {
  children?: SysDictTreeNode[]
}

export interface SysLogEntity {
  id: number
  triggerType?: string
  category?: string
  event?: string
  input?: string
  output?: string
  time?: number
  success?: string
  extra?: string
  comment?: string
  createBy?: string
  createTime?: string
}
