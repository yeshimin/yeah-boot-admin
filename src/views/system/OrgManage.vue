<template>
  <div class="org-manage-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="组织名称">
          <el-input v-model="searchForm.name" placeholder="请输入组织名称" clearable></el-input>
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

    <div class="action-bar">
      <div class="action-buttons">
        <el-button
          v-if="canCreateOrg"
          type="primary"
          @click="handleAddRoot"
        >
          <el-icon><Plus /></el-icon>新增组织
        </el-button>
        <el-button type="info" @click="toggleExpandAll">
          <el-icon><Sort /></el-icon>展开/折叠
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        v-if="refreshTable"
        v-loading="tableLoading"
        :data="orgList"
        row-key="id"
        style="width: 100%"
        :default-expand-all="expandAll"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="name" label="组织名称" min-width="220"></el-table-column>
        <el-table-column prop="sort" label="排序" width="90"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="1"
              inactive-value="2"
              :disabled="!canUpdateOrg"
              @change="handleStatusChange(row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip></el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
        <el-table-column v-if="hasOrgRowActions" label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canCreateOrg"
              link
              type="primary"
              @click="handleAddChild(row)"
            >新增</el-button>
            <el-button
              v-if="canUpdateOrg"
              link
              type="primary"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              v-if="canDeleteOrg"
              link
              type="danger"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      @closed="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="上级组织">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="parentTreeProps"
            value-key="id"
            check-strictly
            default-expand-all
            placeholder="请选择上级组织"
          />
        </el-form-item>
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入组织名称"></el-input>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="999"></el-input-number>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" active-value="1" inactive-value="2"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button v-if="canSubmitOrgForm" type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Plus, Sort } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { createOrg, deleteOrgs, getOrgDetail, getOrgTree, updateOrg } from '@/api/upms'
import type { SysOrgTreeNode } from '@/types/upms'
import { formatDisabledName, isDisabledStatus } from '@/utils/status'

interface ParentOrgOption {
  id: number
  name: string
  disabled?: boolean
  children?: ParentOrgOption[]
}

const authStore = useAuthStore()
const canCreateOrg = computed(() => authStore.hasPermission('admin:sysOrg:create'))
const canUpdateOrg = computed(() => authStore.hasPermission('admin:sysOrg:update'))
const canDeleteOrg = computed(() => authStore.hasPermission('admin:sysOrg:delete'))
const formRef = ref<FormInstance>()
const tableLoading = ref(false)
const orgList = ref<SysOrgTreeNode[]>([])
const parentTree = ref<SysOrgTreeNode[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增组织')
const expandAll = ref(true)
const refreshTable = ref(true)
const lockedDisabledParentId = ref<number | null>(null)

const searchForm = reactive({
  name: '',
  status: '',
})

const createDefaultForm = () => ({
  id: 0,
  name: '',
  parentId: 0,
  sort: 1,
  status: '1',
  remark: '',
})

const form = reactive(createDefaultForm())
const canSubmitOrgForm = computed(() => (form.id ? canUpdateOrg.value : canCreateOrg.value))
const hasOrgRowActions = computed(() => canCreateOrg.value || canUpdateOrg.value || canDeleteOrg.value)
const currentEditingNode = computed(() => (
  form.id ? findNodeById(parentTree.value, form.id) : null
))
const parentOptions = computed<ParentOrgOption[]>(() => [
  {
    id: 0,
    name: '根组织',
    children: parentTree.value.map((node) => createParentOption(node, currentEditingNode.value)),
  },
])
const parentTreeProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  disabled: 'disabled',
}

function warnNoPermission() {
  ElMessage.warning('暂无操作权限')
}

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { min: 2, max: 50, message: '组织名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
})

function findNodeById(nodes: SysOrgTreeNode[], id: number): SysOrgTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const matched = node.children?.length ? findNodeById(node.children, id) : null
    if (matched) {
      return matched
    }
  }
  return null
}

function isSameOrDescendantNode(node: SysOrgTreeNode, id: number): boolean {
  if (node.id === id) {
    return true
  }
  return node.children?.some((child) => isSameOrDescendantNode(child, id)) || false
}

function createParentOption(node: SysOrgTreeNode, editingNode: SysOrgTreeNode | null): ParentOrgOption {
  return {
    id: node.id,
    name: formatDisabledName(node.name, node.status),
    disabled: isDisabledStatus(node.status) || Boolean(editingNode && isSameOrDescendantNode(editingNode, node.id)),
    children: node.children?.map((child) => createParentOption(child, editingNode)) || [],
  }
}

function resolveLockedDisabledParentId(parentId?: number) {
  if (!parentId) {
    return null
  }

  const parent = findNodeById(parentTree.value, parentId)
  return isDisabledStatus(parent?.status) ? parentId : null
}

async function loadOrgTree() {
  tableLoading.value = true
  try {
    const response = await getOrgTree({
      name: searchForm.name || undefined,
      status: searchForm.status || undefined,
    })
    orgList.value = response.data
  } finally {
    tableLoading.value = false
  }
}

async function loadParentTree() {
  const response = await getOrgTree()
  parentTree.value = response.data || []
}

function resetForm() {
  lockedDisabledParentId.value = null
  Object.assign(form, createDefaultForm())
  formRef.value?.clearValidate()
}

function handleAddRoot() {
  if (!canCreateOrg.value) {
    warnNoPermission()
    return
  }
  resetForm()
  dialogTitle.value = '新增组织'
  dialogVisible.value = true
}

function handleAddChild(row?: SysOrgTreeNode) {
  if (!canCreateOrg.value) {
    warnNoPermission()
    return
  }
  if (row && isDisabledStatus(row.status)) {
    ElMessage.warning('禁用组织不能作为上级组织')
    return
  }
  resetForm()
  form.parentId = row?.id || 0
  dialogTitle.value = '新增下级组织'
  dialogVisible.value = true
}

async function handleEdit(row: SysOrgTreeNode) {
  if (!canUpdateOrg.value) {
    warnNoPermission()
    return
  }
  resetForm()
  const response = await getOrgDetail(row.id)
  Object.assign(form, {
    id: response.data.id,
    name: response.data.name,
    parentId: Number(response.data.parentId ?? 0),
    sort: response.data.sort || 1,
    status: response.data.status || '1',
    remark: response.data.remark || '',
  })
  lockedDisabledParentId.value = resolveLockedDisabledParentId(form.parentId)
  dialogTitle.value = '编辑组织'
  dialogVisible.value = true
}

function getDeleteErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return ''
}

function isUserCancel(error: unknown) {
  return error === 'cancel' || error === 'close'
}

function showDeleteError(error: unknown) {
  const message = getDeleteErrorMessage(error)
  if (message.includes('子节点')) {
    ElMessage.warning('该组织存在子组织，请先删除或迁移子组织后再删除')
    return
  }
  if (message.includes('关联')) {
    ElMessage.warning('该组织已绑定用户，请先解除用户关联后再删除')
    return
  }
  ElMessage.error(message || '删除失败')
}

async function handleDelete(row: SysOrgTreeNode) {
  if (!canDeleteOrg.value) {
    warnNoPermission()
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该组织吗？删除前请确认该组织没有子组织且未绑定用户。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteOrgs([row.id], { suppressErrorMessage: true })
    ElMessage.success('删除组织成功')
    await Promise.all([loadOrgTree(), loadParentTree()])
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    showDeleteError(error)
  }
}

async function handleStatusChange(row: SysOrgTreeNode) {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  if (!canUpdateOrg.value) {
    row.status = previousStatus
    warnNoPermission()
    return
  }
  try {
    await updateOrg({
      id: row.id,
      status: nextStatus,
    })
    ElMessage.success(`组织${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch {
    row.status = previousStatus
  }
}

async function handleSubmit() {
  if (!canSubmitOrgForm.value) {
    warnNoPermission()
    return
  }
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
    const payload = {
      id: form.id || undefined,
      name: form.name,
      parentId: lockedDisabledParentId.value ?? form.parentId,
      sort: form.sort,
      status: form.status,
      remark: form.remark,
    }

    if (form.id) {
      await updateOrg(payload)
      ElMessage.success('编辑组织成功')
    } else {
      await createOrg(payload)
      ElMessage.success('新增组织成功')
    }

    dialogVisible.value = false
    await Promise.all([loadOrgTree(), loadParentTree()])
  } catch {
    // 表单或请求失败时保持弹窗
  }
}

async function handleSearch() {
  await loadOrgTree()
}

async function handleReset() {
  Object.assign(searchForm, {
    name: '',
    status: '',
  })
  await loadOrgTree()
}

async function toggleExpandAll() {
  refreshTable.value = false
  expandAll.value = !expandAll.value
  await nextTick()
  refreshTable.value = true
}

function handleDialogClose() {
  resetForm()
}

watch(() => form.parentId, (parentId) => {
  if (!dialogVisible.value || !form.id || lockedDisabledParentId.value === null) {
    return
  }
  if (parentId === lockedDisabledParentId.value) {
    return
  }

  form.parentId = lockedDisabledParentId.value
  ElMessage.warning('当前上级组织已禁用，不能变更')
})

void Promise.all([loadOrgTree(), loadParentTree()])
</script>

<style scoped>
.org-manage-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
  padding: 0;
}

.search-form {
  display: flex;
  align-items: center;
}

.table-container {
  margin-top: 20px;
  flex: 1;
  min-height: 0;
}
</style>
