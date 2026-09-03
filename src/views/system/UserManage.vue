<template>
  <div class="user-manage-container">
    <div class="page-body">
      <div class="org-tree-panel">
        <div class="org-tree-header">
          <h3>组织树</h3>
          <el-button link type="primary" @click="clearOrgFilter">全部用户</el-button>
        </div>
        <el-input
          v-model="treeFilterText"
          placeholder="搜索组织"
          clearable
          size="small"
          class="org-tree-search"
        ></el-input>
        <el-tree
          ref="orgTreeRef"
          :data="orgTreeData"
          node-key="id"
          :props="orgTreeProps"
          default-expand-all
          highlight-current
          :filter-node-method="filterTreeNode"
          @node-click="handleOrgNodeClick"
        />
      </div>

      <div class="user-content-panel">
        <div class="search-bar">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="用户名">
              <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable></el-input>
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="searchForm.mobile" placeholder="请输入手机号" clearable></el-input>
            </el-form-item>
            <el-form-item label="状态" class="status-form-item">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="启用" value="1"></el-option>
                <el-option label="禁用" value="2"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="createDateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                clearable
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="action-bar">
          <div class="action-buttons">
            <el-button
              v-if="canCreateUser"
              type="primary"
              @click="handleAddUser"
            >
              <el-icon><Plus /></el-icon>新增用户
            </el-button>
            <el-button
              v-if="canDeleteUser"
              type="danger"
              :disabled="!hasSelectedUsers"
              @click="handleBatchDeleteUsers"
            >
              批量删除
            </el-button>
          </div>
        </div>

        <div class="table-container">
          <el-table
            ref="userTableRef"
            v-loading="tableLoading"
            :data="userList"
            stripe
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column v-if="canDeleteUser" type="selection" width="55"></el-table-column>
            <el-table-column prop="username" label="用户名" min-width="120"></el-table-column>
            <el-table-column prop="nickname" label="昵称" min-width="100"></el-table-column>
            <el-table-column prop="orgNames" label="组织" min-width="120"></el-table-column>
            <el-table-column prop="postNames" label="岗位" min-width="120"></el-table-column>
            <el-table-column prop="roleNames" label="角色" min-width="120"></el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip></el-table-column>
            <el-table-column prop="status" label="状态" min-width="80">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  active-value="1"
                  inactive-value="2"
                  :disabled="!canUpdateUser"
                  @change="handleStatusChange(scope.row)"
                ></el-switch>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="160"></el-table-column>
            <el-table-column v-if="hasUserRowActions" label="操作" min-width="200" fixed="right">
              <template #default="scope">
                <div class="table-row-actions">
                  <el-button
                    v-if="canViewUserDetail"
                    link
                    type="primary"
                    @click="handleViewUser(scope.row)"
                  >
                    详情
                  </el-button>
                  <el-button
                    v-if="canUpdateUser"
                    link
                    type="primary"
                    @click="handleEditUser(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-dropdown
                    v-if="hasMoreUserActions"
                    trigger="click"
                    @command="handleUserMoreCommand($event, scope.row)"
                  >
                    <el-button link type="primary">
                      更多<el-icon class="more-arrow"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item v-if="canUpdateUser" command="resetPassword">重置密码</el-dropdown-item>
                        <el-dropdown-item v-if="canClearLoginLimit" command="clearLoginLimit">
                          解除登录限制
                        </el-dropdown-item>
                        <el-dropdown-item
                          v-if="canDeleteUser"
                          command="delete"
                          :divided="canUpdateUser || canClearLoginLimit"
                        >
                          删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
      :close-on-click-modal="!userFormSubmitting"
      :close-on-press-escape="!userFormSubmitting"
      :show-close="!userFormSubmitting"
      @closed="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!userForm.id">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="userForm.mobile" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="userForm.gender" placeholder="请选择性别" clearable>
            <el-option label="男" value="1"></el-option>
            <el-option label="女" value="2"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="组织" prop="orgIds">
          <el-select v-model="userForm.orgIds" placeholder="请选择组织" multiple collapse-tags>
            <el-option
              v-for="org in orgOptions"
              :key="org.id"
              :label="org.name"
              :value="org.id"
              :disabled="org.disabled"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" prop="postIds">
          <el-select v-model="userForm.postIds" placeholder="请选择岗位" multiple collapse-tags>
            <el-option
              v-for="post in postOptions"
              :key="post.id"
              :label="post.name"
              :value="post.id"
              :disabled="post.disabled"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="userForm.roleIds" placeholder="请选择角色" multiple collapse-tags>
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
              :disabled="role.disabled"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="userForm.status" active-value="1" inactive-value="2"></el-switch>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="userForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button :disabled="userFormSubmitting" @click="dialogVisible = false">取消</el-button>
          <el-button
            v-if="canSubmitUserForm"
            type="primary"
            :loading="userFormSubmitting"
            @click="handleSubmitUser"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="用户详情"
      width="720px"
    >
      <el-descriptions v-if="currentUserDetail" :column="2" border>
        <el-descriptions-item label="用户名">{{ currentUserDetail.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUserDetail.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUserDetail.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUserDetail.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ currentUserDetail.gender === '1' ? '男' : currentUserDetail.gender === '2' ? '女' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ currentUserDetail.status === '1' ? '启用' : '禁用' }}
        </el-descriptions-item>
        <el-descriptions-item label="组织">
          {{ joinRelatedNames(currentUserDetail.orgs) }}
        </el-descriptions-item>
        <el-descriptions-item label="岗位">
          {{ joinRelatedNames(currentUserDetail.posts) }}
        </el-descriptions-item>
        <el-descriptions-item label="角色" :span="2">
          {{ joinRelatedNames(currentUserDetail.roles) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ currentUserDetail.createTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentUserDetail.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ArrowDown, Plus } from '@element-plus/icons-vue'
import type { ElTree } from 'element-plus'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { clearLoginLimit } from '@/api/auth'
import {
  createUser,
  deleteUsers,
  getOrgTree,
  getUserDetail,
  queryPosts,
  queryRoles,
  queryUsers,
  updateUser,
} from '@/api/upms'
import type { SysOrgTreeNode, SysUserVo } from '@/types/upms'
import { sha256Hex } from '@/utils/crypto'
import { getRequestErrorMessage as getDeleteErrorMessage, isUserCancel } from '@/utils/error'
import { formatDisabledName, isDisabledStatus, joinStatusNames } from '@/utils/status'

type SelectOption = {
  id: number
  name: string
  status?: string
  disabled?: boolean
}

type UserRelationKey = 'orgIds' | 'postIds' | 'roleIds'

interface UserListItem extends SysUserVo {
  nickname: string
  orgNames: string
  postNames: string
  roleNames: string
  remark: string
}

const authStore = useAuthStore()
const canCreateUser = computed(() => authStore.hasPermission('admin:sysUser:create'))
const canViewUserDetail = computed(() => authStore.hasPermission('admin:sysUser:detail'))
const canUpdateUser = computed(() => authStore.hasPermission('admin:sysUser:update'))
const canDeleteUser = computed(() => authStore.hasPermission('admin:sysUser:delete'))
const canClearLoginLimit = computed(() => authStore.hasPermission('view:admin:sysUser:clearLoginLimit'))

// 表格加载状态
const tableLoading = ref(false)
const userTableRef = ref<TableInstance>()

// 搜索表单
const searchForm = reactive({
  username: '',
  mobile: '',
  status: ''
})
const createDateRange = ref<string[]>([])

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 选中的用户列表
const selectedUsers = ref<UserListItem[]>([])
const orgOptions = ref<SelectOption[]>([])
const postOptions = ref<SelectOption[]>([])
const roleOptions = ref<SelectOption[]>([])
const orgTreeData = ref<SysOrgTreeNode[]>([])
const orgTreeRef = ref<InstanceType<typeof ElTree>>()
const treeFilterText = ref('')
const selectedOrgId = ref<number | null>(null)
const orgTreeProps = {
  children: 'children',
  label: 'name',
}

// 用户列表数据
const userList = ref<UserListItem[]>([])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const userFormSubmitting = ref(false)
const detailVisible = ref(false)
const currentUserDetail = ref<SysUserVo | null>(null)

// 用户表单引用
const userFormRef = ref<FormInstance>()

const createDefaultUserForm = () => ({
  id: 0,
  username: '',
  nickname: '',
  password: '',
  mobile: '',
  email: '',
  gender: '',
  orgIds: [] as number[],
  postIds: [] as number[],
  roleIds: [] as number[],
  status: '1',
  remark: '',
  createTime: ''
})

// 用户表单数据
const userForm = reactive(createDefaultUserForm())
const lockedDisabledRelationIds = reactive<Record<UserRelationKey, number[]>>({
  orgIds: [],
  postIds: [],
  roleIds: [],
})
const canSubmitUserForm = computed(() => (userForm.id ? canUpdateUser.value : canCreateUser.value))
const selectedUserIds = computed(() => (
  selectedUsers.value
    .map((item) => Number(item.id))
    .filter((id) => Number.isFinite(id))
))
const hasSelectedUsers = computed(() => selectedUserIds.value.length > 0)
const hasMoreUserActions = computed(() => canUpdateUser.value || canClearLoginLimit.value || canDeleteUser.value)
const hasUserRowActions = computed(() => (
  canViewUserDetail.value || canUpdateUser.value || hasMoreUserActions.value
))

function warnNoPermission() {
  ElMessage.warning('暂无操作权限')
}

const clearSelectedUsers = () => {
  selectedUsers.value = []
  userTableRef.value?.clearSelection()
}

// 用户表单验证规则
const userRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  orgIds: [
    { required: true, message: '请选择组织', trigger: 'change' }
  ],
  roleIds: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  postIds: [
    { required: true, message: '请选择岗位', trigger: 'change' }
  ]
})

const flattenOrgTree = (tree: SysOrgTreeNode[], prefix = ''): SelectOption[] => {
  return tree.flatMap((node) => {
    const name = `${prefix}${node.name}`
    const disabled = isDisabledStatus(node.status)
    const current = [{
      id: node.id,
      name: formatDisabledName(name, node.status),
      status: node.status,
      disabled,
    }]
    const children = node.children ? flattenOrgTree(node.children, `${prefix}└─ `) : []
    return [...current, ...children]
  })
}

const loadOptions = async () => {
  const [orgTreeResponse, postResponse, roleResponse] = await Promise.all([
    getOrgTree(),
    queryPosts({ current: 1, size: 1000 }),
    queryRoles({ current: 1, size: 1000 }),
  ])

  orgTreeData.value = orgTreeResponse.data
  orgOptions.value = flattenOrgTree(orgTreeResponse.data)
  postOptions.value = postResponse.data.records.map((post) => ({
    id: post.id,
    name: formatDisabledName(post.name, post.status),
    status: post.status,
    disabled: isDisabledStatus(post.status),
  }))
  roleOptions.value = roleResponse.data.records.map((role) => ({
    id: role.id,
    name: formatDisabledName(role.name, role.status),
    status: role.status,
    disabled: isDisabledStatus(role.status),
  }))
}

const buildUserPayload = () => ({
  id: userForm.id || undefined,
  username: userForm.username,
  password: userForm.password || undefined,
  nickname: userForm.nickname,
  mobile: userForm.mobile,
  email: userForm.email,
  gender: userForm.gender || undefined,
  orgIds: mergeSelectedIds(userForm.orgIds, lockedDisabledRelationIds.orgIds),
  postIds: mergeSelectedIds(userForm.postIds, lockedDisabledRelationIds.postIds),
  roleIds: mergeSelectedIds(userForm.roleIds, lockedDisabledRelationIds.roleIds),
  status: userForm.status,
  remark: userForm.remark,
})

function joinRelatedNames(items?: Array<{ name?: string; status?: string } | null>) {
  return joinStatusNames(items)
}

function collectDisabledRelationIds(items?: Array<{ id: number; status?: string } | null>) {
  return items
    ?.filter((item): item is { id: number; status?: string } => (
      item !== null && item !== undefined && isDisabledStatus(item.status)
    ))
    .map((item) => item.id) || []
}

function mergeSelectedIds(selectedIds: number[], lockedIds: number[]) {
  return Array.from(new Set([...selectedIds, ...lockedIds]))
}

function syncLockedDisabledRelations(detail?: SysUserVo) {
  lockedDisabledRelationIds.orgIds = collectDisabledRelationIds(detail?.orgs)
  lockedDisabledRelationIds.postIds = collectDisabledRelationIds(detail?.posts)
  lockedDisabledRelationIds.roleIds = collectDisabledRelationIds(detail?.roles)
}

function ensureLockedSelection(key: UserRelationKey, selectedIds: number[]) {
  if (!dialogVisible.value || !userForm.id) {
    return
  }

  const lockedIds = lockedDisabledRelationIds[key]
  if (!lockedIds.length || lockedIds.every((id) => selectedIds.includes(id))) {
    return
  }

  userForm[key] = mergeSelectedIds(selectedIds, lockedIds)
}

// 页面加载时获取用户列表
onMounted(() => {
  void Promise.all([loadOptions(), getUserList()])
})

// 获取用户列表
const getUserList = async () => {
  clearSelectedUsers()
  tableLoading.value = true
  try {
    const response = await queryUsers({
      current: pagination.currentPage,
      size: pagination.pageSize,
      username: searchForm.username || undefined,
      mobile: searchForm.mobile || undefined,
      status: searchForm.status || undefined,
      createDateBegin: createDateRange.value[0] || undefined,
      createDateEnd: createDateRange.value[1] || undefined,
      orgIds: selectedOrgId.value ? [selectedOrgId.value] : undefined,
    })

    userList.value = response.data.records.map((user) => ({
      ...user,
      nickname: user.nickname || '-',
      orgNames: joinRelatedNames(user.orgs),
      postNames: joinRelatedNames(user.posts),
      roleNames: joinRelatedNames(user.roles),
      remark: user.remark || '-',
    }))
    pagination.total = response.data.total
  } finally {
    tableLoading.value = false
  }
}

// 搜索用户
const handleSearch = async () => {
  pagination.currentPage = 1
  await getUserList()
}

// 重置搜索表单
const handleReset = async () => {
  Object.assign(searchForm, {
    username: '',
    mobile: '',
    status: ''
  })
  createDateRange.value = []
  selectedOrgId.value = null
  orgTreeRef.value?.setCurrentKey(undefined)
  pagination.currentPage = 1
  await getUserList()
}

// 分页大小变化
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  await getUserList()
}

// 当前页码变化
const handleCurrentChange = async (page: number) => {
  pagination.currentPage = page
  await getUserList()
}

// 选择用户变化
const handleSelectionChange = (selection: UserListItem[]) => {
  selectedUsers.value = selection
}

// 新增用户
const handleAddUser = () => {
  if (!canCreateUser.value) {
    warnNoPermission()
    return
  }
  dialogTitle.value = '新增用户'
  resetUserForm()
  dialogVisible.value = true
}

const handleViewUser = async (row: UserListItem) => {
  if (!canViewUserDetail.value) {
    warnNoPermission()
    return
  }
  const response = await getUserDetail(row.id)
  currentUserDetail.value = response.data
  detailVisible.value = true
}

// 编辑用户
const handleEditUser = async (row: UserListItem) => {
  if (!canUpdateUser.value) {
    warnNoPermission()
    return
  }
  dialogTitle.value = '编辑用户'
  const response = await getUserDetail(row.id)
  const detail = response.data
  Object.assign(userForm, {
    id: detail.id,
    username: detail.username,
    nickname: detail.nickname || '',
    password: '',
    mobile: detail.mobile || '',
    email: detail.email || '',
    gender: detail.gender || '',
    orgIds: detail.orgs?.map((item) => item.id) || [],
    postIds: detail.posts?.map((item) => item.id) || [],
    roleIds: detail.roles?.map((item) => item.id) || [],
    status: detail.status || '1',
    remark: detail.remark || '',
    createTime: detail.createTime || '',
  })
  syncLockedDisabledRelations(detail)
  dialogVisible.value = true
}

function showDeleteError(error: unknown) {
  const message = getDeleteErrorMessage(error)
  if (message.includes('不能删除自己')) {
    ElMessage.warning('不能删除当前登录用户')
    return
  }
  if (message.includes('不能删除超级管理员')) {
    ElMessage.warning('不能删除超级管理员')
    return
  }
  if (message.includes('用户') && message.includes('未找到')) {
    ElMessage.warning(message)
    return
  }
  ElMessage.error(message || '删除失败')
}

function showUserUpdateError(error: unknown, fallbackMessage = '操作失败') {
  const message = getDeleteErrorMessage(error)
  if (message.includes('不能禁用自己')) {
    ElMessage.warning('不能禁用当前登录用户')
    return
  }
  if (message.includes('超级管理员不能禁用')) {
    ElMessage.warning('不能禁用超级管理员')
    return
  }
  ElMessage.error(message || fallbackMessage)
}

function showSubmitError(error: unknown, fallbackMessage: string) {
  const message = getDeleteErrorMessage(error)
  if (!message) {
    return
  }
  showUserUpdateError(error, fallbackMessage)
}

// 删除用户
const handleDeleteUser = async (row: UserListItem) => {
  if (!canDeleteUser.value) {
    warnNoPermission()
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？删除后会同步清理该用户的组织、岗位、角色关联和登录状态。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUsers([row.id], { suppressErrorMessage: true })
    ElMessage.success('删除成功')
    await getUserList()
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    showDeleteError(error)
  }
}

const handleBatchDeleteUsers = async () => {
  if (!canDeleteUser.value) {
    warnNoPermission()
    return
  }

  const ids = selectedUserIds.value
  if (ids.length === 0) {
    ElMessage.warning('请先选择要删除的用户')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${ids.length} 个用户吗？删除后会同步清理这些用户的组织、岗位、角色关联和登录状态。`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUsers(ids, { suppressErrorMessage: true })
    clearSelectedUsers()
    ElMessage.success('批量删除成功')
    await getUserList()
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    showDeleteError(error)
  }
}

// 状态变化
const handleStatusChange = async (row: UserListItem) => {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  if (!canUpdateUser.value) {
    row.status = previousStatus
    warnNoPermission()
    return
  }
  try {
    if (nextStatus === '2') {
      await ElMessageBox.confirm(
        '确定要禁用该用户吗？禁用后该用户将无法登录，并会被强制下线。',
        '确认禁用',
        {
          confirmButtonText: '确定禁用',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    }
    await updateUser({
      id: row.id,
      status: nextStatus,
    }, { suppressErrorMessage: true })
    ElMessage.success(`用户${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch (error) {
    row.status = previousStatus
    if (isUserCancel(error)) {
      return
    }
    showUserUpdateError(error, '状态更新失败')
  }
}

// 重置密码
const handleResetPassword = async (row: UserListItem) => {
  if (!canUpdateUser.value) {
    warnNoPermission()
    return
  }
  ElMessageBox.prompt('请输入新密码，至少 6 位', '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password',
    inputPattern: /^.{6,}$/,
    inputErrorMessage: '密码长度不能少于 6 位',
  }).then(async ({ value }) => {
    const hashedPassword = await sha256Hex(value.trim())
    await updateUser({
      id: row.id,
      password: hashedPassword,
    })
    ElMessage.success('密码重置成功')
  }).catch(() => {
    // 取消重置
  })
}

// 解除登录限制
const handleClearLoginLimit = async (row: UserListItem) => {
  if (!canClearLoginLimit.value) {
    warnNoPermission()
    return
  }
  try {
    await ElMessageBox.confirm(`确定要解除用户“${row.username}”在Web端的登录限制吗？`, '解除登录限制', {
      confirmButtonText: '确定解除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await clearLoginLimit({ username: row.username })
    ElMessage.success('登录限制已解除')
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
  }
}

const handleUserMoreCommand = async (command: string, row: UserListItem) => {
  if (command === 'resetPassword') {
    await handleResetPassword(row)
  } else if (command === 'clearLoginLimit') {
    await handleClearLoginLimit(row)
  } else if (command === 'delete') {
    await handleDeleteUser(row)
  }
}

// 提交用户表单
const handleSubmitUser = async () => {
  if (userFormSubmitting.value) {
    return
  }
  if (!canSubmitUserForm.value) {
    warnNoPermission()
    return
  }
  if (!userFormRef.value) return
  const fallbackMessage = userForm.id ? '编辑用户失败' : '新增用户失败'
  userFormSubmitting.value = true
  try {
    await userFormRef.value.validate()
    const payload = buildUserPayload()

    if (userForm.id) {
      await updateUser(payload, { suppressErrorMessage: true })
      ElMessage.success('编辑用户成功')
    } else {
      payload.password = await sha256Hex(userForm.password.trim())
      await createUser(payload, { suppressErrorMessage: true })
      ElMessage.success('新增用户成功')
    }
    dialogVisible.value = false
    await getUserList()
  } catch (error) {
    showSubmitError(error, fallbackMessage)
  } finally {
    userFormSubmitting.value = false
  }
}

// 重置用户表单
const resetUserForm = () => {
  syncLockedDisabledRelations()
  Object.assign(userForm, createDefaultUserForm())
  userFormRef.value?.clearValidate()
}

// 关闭对话框
const handleDialogClose = () => {
  resetUserForm()
}

const handleOrgNodeClick = async (node: SysOrgTreeNode) => {
  selectedOrgId.value = node.id
  pagination.currentPage = 1
  await getUserList()
}

const clearOrgFilter = async () => {
  selectedOrgId.value = null
  orgTreeRef.value?.setCurrentKey(undefined)
  pagination.currentPage = 1
  await getUserList()
}

const filterTreeNode = (value: string, data: SysOrgTreeNode) => {
  if (!value) {
    return true
  }
  return data.name.includes(value)
}

watch(treeFilterText, (value) => {
  orgTreeRef.value?.filter(value)
})

watch(() => userForm.orgIds, (value) => {
  ensureLockedSelection('orgIds', value)
}, { deep: true })

watch(() => userForm.postIds, (value) => {
  ensureLockedSelection('postIds', value)
}, { deep: true })

watch(() => userForm.roleIds, (value) => {
  ensureLockedSelection('roleIds', value)
}, { deep: true })
</script>

<style scoped>
.user-manage-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.org-tree-panel {
  min-height: 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fff;
  padding: 16px;
}

.org-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.org-tree-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.org-tree-search {
  margin-bottom: 12px;
}

.user-content-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.search-bar {
  margin-bottom: 20px;
  padding: 0;
}

.search-form {
  display: flex;
  align-items: center;
}

.status-form-item :deep(.el-form-item__label) {
  min-width: 42px;
}

.table-container {
  margin-top: 20px;
  flex: 1;
  min-height: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.more-arrow {
  margin-left: 4px;
}

</style>
