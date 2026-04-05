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
          v-if="authStore.canAction('/system/org', { names: ['新增组织', '新增'], permissions: ['admin:sysOrg:create', 'admin:sysOrg:crud:create'] })"
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
              :disabled="
                !authStore.canAction('/system/org', {
                  names: ['编辑组织', '编辑'],
                  permissions: ['admin:sysOrg:update', 'admin:sysOrg:crud:update'],
                })
              "
              @change="handleStatusChange(row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip></el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="authStore.canAction('/system/org', { names: ['新增组织', '新增'], permissions: ['admin:sysOrg:create', 'admin:sysOrg:crud:create'] })"
              link
              type="primary"
              @click="handleAddChild(row)"
            >新增</el-button>
            <el-button
              v-if="authStore.canAction('/system/org', { names: ['编辑组织', '编辑'], permissions: ['admin:sysOrg:update', 'admin:sysOrg:crud:update'] })"
              link
              type="primary"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              v-if="authStore.canAction('/system/org', { names: ['删除组织', '删除'], permissions: ['admin:sysOrg:delete', 'admin:sysOrg:crud:delete'] })"
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
      @close="handleDialogClose"
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
            :props="{ value: 'id', label: 'name', children: 'children' }"
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
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import { Plus, Sort } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { createOrg, deleteOrgs, getOrgDetail, getOrgTree, updateOrg } from '@/api/upms'
import type { SysOrgTreeNode } from '@/types/upms'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const tableLoading = ref(false)
const orgList = ref<SysOrgTreeNode[]>([])
const parentOptions = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增组织')
const expandAll = ref(true)
const refreshTable = ref(true)

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

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { min: 2, max: 50, message: '组织名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
})

async function loadOrgTree() {
  tableLoading.value = true
  try {
    const response = await getOrgTree({
      name: searchForm.name || undefined,
      status: searchForm.status || undefined,
    })
    orgList.value = response.data
    parentOptions.value = [
      {
        id: 0,
        name: '根组织',
        children: response.data,
      },
    ]
  } finally {
    tableLoading.value = false
  }
}

function resetForm() {
  Object.assign(form, createDefaultForm())
  formRef.value?.clearValidate()
}

function handleAddRoot() {
  resetForm()
  dialogTitle.value = '新增组织'
  dialogVisible.value = true
}

function handleAddChild(row?: SysOrgTreeNode) {
  resetForm()
  form.parentId = row?.id || 0
  dialogTitle.value = '新增下级组织'
  dialogVisible.value = true
}

async function handleEdit(row: SysOrgTreeNode) {
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
  dialogTitle.value = '编辑组织'
  dialogVisible.value = true
}

async function handleDelete(row: SysOrgTreeNode) {
  ElMessageBox.confirm('确定要删除该组织吗？删除后该组织下的所有子组织也将被删除', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteOrgs([row.id])
    ElMessage.success('删除组织成功')
    await loadOrgTree()
  }).catch(() => {
    // 用户取消
  })
}

async function handleStatusChange(row: SysOrgTreeNode) {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
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
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
    const payload = {
      id: form.id || undefined,
      name: form.name,
      parentId: form.parentId,
      sort: form.sort,
      status: form.status,
      remark: form.remark || undefined,
    }

    if (form.id) {
      await updateOrg(payload)
      ElMessage.success('编辑组织成功')
    } else {
      await createOrg(payload)
      ElMessage.success('新增组织成功')
    }

    dialogVisible.value = false
    await loadOrgTree()
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

void loadOrgTree()
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
