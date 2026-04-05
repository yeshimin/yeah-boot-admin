<template>
  <div class="user-manage-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button
        v-if="authStore.canAction('/system/user', { names: ['新增用户', '新增'], permissions: ['admin:sysUser:create', 'admin:sysUser:crud:create'] })"
        type="primary"
        @click="handleAddUser"
      >
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
    </div>

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

        <div class="table-container">
          <el-table
            v-loading="tableLoading"
            :data="userList"
            stripe
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55"></el-table-column>
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
                  @change="handleStatusChange(scope.row)"
                ></el-switch>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="160"></el-table-column>
            <el-table-column label="操作" min-width="240" fixed="right">
              <template #default="scope">
                <el-button type="info" size="small" @click="handleViewUser(scope.row)">
                  详情
                </el-button>
                <el-button
                  v-if="authStore.canAction('/system/user', { names: ['编辑用户', '编辑'], permissions: ['admin:sysUser:update', 'admin:sysUser:crud:update'] })"
                  type="primary"
                  size="small"
                  @click="handleEditUser(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="authStore.canAction('/system/user', { names: ['重置密码'], permissions: ['admin:sysUser:resetPwd'] })"
                  type="success"
                  size="small"
                  @click="handleResetPassword(scope.row)"
                >
                  重置密码
                </el-button>
                <el-button
                  v-if="authStore.canAction('/system/user', { names: ['删除用户', '删除'], permissions: ['admin:sysUser:delete', 'admin:sysUser:crud:delete'] })"
                  type="danger"
                  size="small"
                  @click="handleDeleteUser(scope.row)"
                >
                  删除
                </el-button>
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
      @close="handleDialogClose"
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
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitUser">确定</el-button>
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
          {{ currentUserDetail.orgs?.map((item) => item.name).join('、') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="岗位">
          {{ currentUserDetail.posts?.map((item) => item.name).join('、') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="角色" :span="2">
          {{ currentUserDetail.roles?.map((item) => item.name).join('、') || '-' }}
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
import { onMounted, reactive, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { ElTree } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
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

const authStore = useAuthStore()

// 表格加载状态
const tableLoading = ref(false)

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
const selectedUsers = ref<any[]>([])
const orgOptions = ref<{ id: number; name: string }[]>([])
const postOptions = ref<{ id: number; name: string }[]>([])
const roleOptions = ref<{ id: number; name: string }[]>([])
const orgTreeData = ref<SysOrgTreeNode[]>([])
const orgTreeRef = ref<InstanceType<typeof ElTree>>()
const treeFilterText = ref('')
const selectedOrgId = ref<number | null>(null)
const orgTreeProps = {
  children: 'children',
  label: 'name',
}

// 用户列表数据
const userList = ref<any[]>([])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
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

const flattenOrgTree = (tree: SysOrgTreeNode[], prefix = ''): { id: number; name: string }[] => {
  return tree.flatMap((node) => {
    const current = [{ id: node.id, name: `${prefix}${node.name}` }]
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
    name: post.name,
  }))
  roleOptions.value = roleResponse.data.records.map((role) => ({
    id: role.id,
    name: role.name,
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
  orgIds: userForm.orgIds,
  postIds: userForm.postIds,
  roleIds: userForm.roleIds,
  status: userForm.status,
  remark: userForm.remark,
})

// 页面加载时获取用户列表
onMounted(() => {
  void Promise.all([loadOptions(), getUserList()])
})

// 获取用户列表
const getUserList = async () => {
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
      orgNames: user.orgs?.map((item) => item.name).join('、') || '-',
      postNames: user.posts?.map((item) => item.name).join('、') || '-',
      roleNames: user.roles?.map((item) => item.name).join('、') || '-',
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
const handleSelectionChange = (selection: any[]) => {
  selectedUsers.value = selection
}

// 新增用户
const handleAddUser = () => {
  dialogTitle.value = '新增用户'
  resetUserForm()
  dialogVisible.value = true
}

const handleViewUser = async (row: any) => {
  const response = await getUserDetail(row.id)
  currentUserDetail.value = response.data
  detailVisible.value = true
}

// 编辑用户
const handleEditUser = async (row: any) => {
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
  dialogVisible.value = true
}

// 删除用户
const handleDeleteUser = async (row: any) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteUsers([row.id])
    ElMessage.success('删除成功')
    await getUserList()
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = async (row: any) => {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  try {
    await updateUser({
      id: row.id,
      status: nextStatus,
    })
    ElMessage.success(`用户${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch {
    row.status = previousStatus
  }
}

// 重置密码
const handleResetPassword = async (row: any) => {
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

// 提交用户表单
const handleSubmitUser = async () => {
  if (!userFormRef.value) return
  try {
    await userFormRef.value.validate()
    const payload = buildUserPayload()

    if (userForm.id) {
      await updateUser(payload)
      ElMessage.success('编辑用户成功')
    } else {
      payload.password = await sha256Hex(userForm.password.trim())
      await createUser(payload)
      ElMessage.success('新增用户成功')
    }
    dialogVisible.value = false
    await getUserList()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置用户表单
const resetUserForm = () => {
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
</script>

<style scoped>
.user-manage-container {
  width: 100%;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.org-tree-panel {
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
  min-width: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
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
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
