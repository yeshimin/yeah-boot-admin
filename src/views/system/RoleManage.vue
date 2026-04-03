<template>
  <div class="role-manage-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="handleAddRole">
        <el-icon><Plus /></el-icon>新增角色
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.name" placeholder="请输入角色名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="1"></el-option>
            <el-option label="禁用" value="2"></el-option>
          </el-select>
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
        :data="roleList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="code" label="角色编码" min-width="140"></el-table-column>
        <el-table-column prop="name" label="角色名称" min-width="120"></el-table-column>
        <el-table-column prop="remark" label="描述" min-width="200"></el-table-column>
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
        <el-table-column label="操作" min-width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEditRole(scope.row)">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="handleAssignPermission(scope.row)">
              分配权限
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteRole(scope.row)">
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

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
      >
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色编码"></el-input>
        </el-form-item>
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="remark">
          <el-input
            v-model="roleForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="roleForm.status" active-value="1" inactive-value="2"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitRole">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配权限弹窗 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="分配权限"
      width="600px"
      @close="handlePermissionDialogClose"
    >
      <div class="permission-tree-container">
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          show-checkbox
          node-key="id"
          :props="permissionTreeProps"
          :default-checked-keys="checkedPermissions"
          @check="handlePermissionCheck"
        ></el-tree>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitPermission">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  createRole,
  deleteRoles,
  getRoleDetail,
  queryRoleResourceTree,
  queryRoles,
  setRoleResources,
  updateRole,
} from '@/api/upms'
import { buildConditions } from '@/utils/query'

// 表格加载状态
const tableLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 选中的角色列表
const selectedRoles = ref<any[]>([])

// 角色列表数据
const roleList = ref<any[]>([])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')

// 角色表单引用
const roleFormRef = ref<FormInstance>()

// 角色表单数据
const roleForm = reactive({
  id: 0,
  code: '',
  name: '',
  remark: '',
  status: '1',
  permissions: [] as number[],
  createTime: ''
})

// 角色表单验证规则
const roleRules = reactive<FormRules>({
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 50, message: '角色编码长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  remark: [
    { max: 100, message: '角色描述不能超过 100 个字符', trigger: 'blur' }
  ]
})

// 权限分配弹窗
const permissionDialogVisible = ref(false)
const permissionTreeRef = ref<any>()
const checkedPermissions = ref<number[]>([])
const currentRole = ref<any>(null)

// 权限树数据
const permissionTree = ref<any[]>([])

// 权限树配置
const permissionTreeProps = {
  children: 'children',
  label: 'name'
}

// 页面加载时获取角色列表
onMounted(() => {
  void getRoleList()
})

// 获取角色列表
const getRoleList = async () => {
  tableLoading.value = true
  try {
    const response = await queryRoles({
      current: pagination.currentPage,
      size: pagination.pageSize,
      conditions_: buildConditions([
        { field: 'name', operator: 'like', value: searchForm.name },
      ]),
      status: searchForm.status || undefined,
    })

    roleList.value = response.data.records.map((role) => ({
      ...role,
      permissions: [],
    }))
    pagination.total = response.data.total
  } finally {
    tableLoading.value = false
  }
}

// 搜索角色
const handleSearch = async () => {
  pagination.currentPage = 1
  await getRoleList()
}

// 重置搜索表单
const handleReset = async () => {
  Object.assign(searchForm, {
    name: '',
    status: ''
  })
  pagination.currentPage = 1
  await getRoleList()
}

// 分页大小变化
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  await getRoleList()
}

// 当前页码变化
const handleCurrentChange = async (page: number) => {
  pagination.currentPage = page
  await getRoleList()
}

// 选择角色变化
const handleSelectionChange = (selection: any[]) => {
  selectedRoles.value = selection
}

// 新增角色
const handleAddRole = () => {
  dialogTitle.value = '新增角色'
  resetRoleForm()
  dialogVisible.value = true
}

// 编辑角色
const handleEditRole = async (row: any) => {
  dialogTitle.value = '编辑角色'
  const response = await getRoleDetail(row.id)
  Object.assign(roleForm, {
    id: response.data.id,
    code: response.data.code || '',
    name: response.data.name,
    remark: response.data.remark || '',
    status: response.data.status || '1',
    permissions: [],
    createTime: response.data.createTime || '',
  })
  dialogVisible.value = true
}

// 删除角色
const handleDeleteRole = async (row: any) => {
  ElMessageBox.confirm('确定要删除该角色吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteRoles([row.id])
    ElMessage.success('删除成功')
    await getRoleList()
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = async (row: any) => {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  try {
    await updateRole({
      id: row.id,
      status: nextStatus,
    })
    ElMessage.success(`角色${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch {
    row.status = previousStatus
  }
}

// 分配权限
const collectCheckedIds = (tree: any[]): number[] => {
  return tree.flatMap((item) => {
    const current = item.checked ? [item.id] : []
    const children = item.children ? collectCheckedIds(item.children) : []
    return [...current, ...children]
  })
}

const handleAssignPermission = async (row: any) => {
  currentRole.value = row
  const response = await queryRoleResourceTree(row.id)
  permissionTree.value = response.data
  checkedPermissions.value = collectCheckedIds(response.data)
  await nextTick()
  permissionTreeRef.value?.setCheckedKeys(checkedPermissions.value)
  permissionDialogVisible.value = true
}

// 提交角色表单
const handleSubmitRole = async () => {
  if (!roleFormRef.value) return
  try {
    await roleFormRef.value.validate()
    const payload = {
      id: roleForm.id || undefined,
      code: roleForm.code,
      name: roleForm.name,
      remark: roleForm.remark,
      status: roleForm.status,
    }

    if (roleForm.id) {
      await updateRole(payload)
      ElMessage.success('编辑角色成功')
    } else {
      await createRole(payload)
      ElMessage.success('新增角色成功')
    }
    dialogVisible.value = false
    await getRoleList()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 提交权限分配
const handleSubmitPermission = async () => {
  if (!currentRole.value) return

  // 获取选中的权限
  const checkedKeys = permissionTreeRef.value.getCheckedKeys() as number[]
  await setRoleResources(currentRole.value.id, checkedKeys)
  currentRole.value.permissions = checkedKeys

  // 更新角色列表中的权限
  const index = roleList.value.findIndex(item => item.id === currentRole.value.id)
  if (index > -1) {
    const targetRole = roleList.value[index]
    if (targetRole) {
      targetRole.permissions = checkedKeys
    }
  }

  ElMessage.success('权限分配成功')
  permissionDialogVisible.value = false
  currentRole.value = null
}

// 权限勾选变化
const handlePermissionCheck = (data: any, checked: any) => {
  // 处理权限勾选逻辑
}

// 重置角色表单
const resetRoleForm = () => {
  Object.assign(roleForm, {
    id: 0,
    code: '',
    name: '',
    remark: '',
    status: '1',
    permissions: [],
    createTime: ''
  })
  if (roleFormRef.value) {
    roleFormRef.value.resetFields()
  }
}

// 关闭角色对话框
const handleDialogClose = () => {
  resetRoleForm()
}

// 关闭权限分配对话框
const handlePermissionDialogClose = () => {
  checkedPermissions.value = []
  currentRole.value = null
}
</script>

<style scoped>
.role-manage-container {
  width: 100%;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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

.table-container {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.permission-tree-container {
  max-height: 400px;
  overflow-y: auto;
}
</style>
