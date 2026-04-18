<template>
  <div class="dict-manage-container">
    <div class="action-bar">
      <div class="action-buttons">
        <el-button
          v-if="authStore.canAction('/system/dict', { names: ['新增根节点', '新增子节点', '新增'], permissions: ['admin:sysDict:create', 'admin:sysDict:crud:create'] })"
          type="primary"
          @click="handleAddRoot"
        >
          <el-icon><Plus /></el-icon>新增根节点
        </el-button>
        <el-button
          v-if="authStore.canAction('/system/dict', { names: ['新增根节点', '新增子节点', '新增'], permissions: ['admin:sysDict:create', 'admin:sysDict:crud:create'] })"
          :disabled="!currentNode"
          @click="handleAddChild"
        >
          <el-icon><Plus /></el-icon>新增子节点
        </el-button>
      </div>
    </div>

    <div class="dict-layout">
      <div class="dict-tree-panel">
        <div class="tree-header">
          <h3>字典树</h3>
          <el-input
            v-model="treeFilterText"
            placeholder="按名称过滤"
            clearable
            size="small"
          ></el-input>
        </div>
        <div class="tree-content">
          <el-tree
            ref="treeRef"
            :data="dictTree"
            node-key="id"
            :props="treeProps"
            default-expand-all
            :expand-on-click-node="false"
            :filter-node-method="filterTreeNode"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <div class="tree-node-row">
                <span class="tree-node-label">{{ data.name }}</span>
                <div class="tree-node-actions">
                  <el-button
                    v-if="authStore.canAction('/system/dict', { names: ['新增根节点', '新增子节点', '新增'], permissions: ['admin:sysDict:create', 'admin:sysDict:crud:create'] })"
                    link
                    type="primary"
                    size="small"
                    class="tree-action-btn"
                    @click.stop="handleAddChild(data)"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-button>
                  <el-button
                    v-if="authStore.canAction('/system/dict', { names: ['编辑当前节点', '编辑'], permissions: ['admin:sysDict:update', 'admin:sysDict:crud:update'] })"
                    link
                    type="primary"
                    size="small"
                    class="tree-action-btn"
                    @click.stop="handleEdit(data)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    v-if="authStore.canAction('/system/dict', { names: ['删除当前节点', '删除'], permissions: ['admin:sysDict:delete', 'admin:sysDict:crud:delete'] })"
                    link
                    type="danger"
                    size="small"
                    class="tree-action-btn"
                    @click.stop="handleDelete(data)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <div class="dict-detail-panel">
        <div class="detail-header">
          <h3>当前节点</h3>
          <div class="detail-actions" v-if="currentNode">
            <el-button
              v-if="authStore.canAction('/system/dict', { names: ['编辑当前节点', '编辑'], permissions: ['admin:sysDict:update', 'admin:sysDict:crud:update'] })"
              size="small"
              type="primary"
              @click="handleEdit(currentNode)"
            >编辑当前节点</el-button>
            <el-button
              v-if="authStore.canAction('/system/dict', { names: ['删除当前节点', '删除'], permissions: ['admin:sysDict:delete', 'admin:sysDict:crud:delete'] })"
              size="small"
              type="danger"
              @click="handleDelete(currentNode)"
            >删除当前节点</el-button>
          </div>
        </div>

        <el-descriptions v-if="currentNode" :column="2" border class="node-detail-card">
          <el-descriptions-item label="名称">{{ currentNode.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="编码">{{ currentNode.code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="值">{{ currentNode.value || '-' }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ currentNode.sort ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ currentNode.createTime || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentNode.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-subheader">
          <h3>下级子节点</h3>
        </div>

        <el-table
          v-loading="tableLoading"
          :data="tableRows"
          row-key="id"
          border
          style="width: 100%"
          empty-text="当前节点没有下级子节点"
        >
          <el-table-column prop="name" label="名称" min-width="160"></el-table-column>
          <el-table-column prop="code" label="编码" min-width="140"></el-table-column>
          <el-table-column prop="value" label="值" min-width="140"></el-table-column>
          <el-table-column prop="sort" label="排序" width="90"></el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180"></el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="180"></el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="authStore.canAction('/system/dict', { names: ['新增根节点', '新增子节点', '新增'], permissions: ['admin:sysDict:create', 'admin:sysDict:crud:create'] })"
                link
                type="primary"
                @click="handleAddChild(row)"
              >新增子节点</el-button>
              <el-button
                v-if="authStore.canAction('/system/dict', { names: ['编辑当前节点', '编辑'], permissions: ['admin:sysDict:update', 'admin:sysDict:crud:update'] })"
                link
                type="primary"
                @click="handleEdit(row)"
              >编辑</el-button>
              <el-button
                v-if="authStore.canAction('/system/dict', { names: ['删除当前节点', '删除'], permissions: ['admin:sysDict:delete', 'admin:sysDict:crud:delete'] })"
                link
                type="danger"
                @click="handleDelete(row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="上级节点">
          <el-input :model-value="parentDisplayName" disabled></el-input>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称"></el-input>
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入编码"></el-input>
        </el-form-item>
        <el-form-item label="值" prop="value">
          <el-input v-model="form.value" placeholder="请输入值"></el-input>
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
import { computed, reactive, ref, watch } from 'vue'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { createDict, deleteDicts, getDictDetail, getDictTree, updateDict } from '@/api/upms'
import type { SysDictTreeNode } from '@/types/upms'

const authStore = useAuthStore()

const treeRef = ref()
const formRef = ref<FormInstance>()
const treeFilterText = ref('')
const tableLoading = ref(false)
const dictTree = ref<SysDictTreeNode[]>([])
const currentNode = ref<SysDictTreeNode | null>(null)
const dialogVisible = ref(false)
const dialogTitle = ref('新增字典节点')

const treeProps = {
  children: 'children',
  label: 'name',
}

const form = ref({
  id: 0,
  parentId: 0,
  code: '',
  name: '',
  value: '',
  sort: 1,
  remark: '',
})

const formRules = reactive<FormRules>({
  code: [
    { required: true, message: '请输入编码', trigger: 'blur' },
    { min: 1, max: 50, message: '编码长度在 1 到 50 个字符', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' },
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
})

const tableRows = computed(() => {
  if (!currentNode.value) {
    return dictTree.value
  }
  return currentNode.value.children || []
})

const parentDisplayName = computed(() => {
  if (!form.value.parentId) {
    return '顶级节点'
  }
  return findNodeName(dictTree.value, form.value.parentId) || '顶级节点'
})

function filterTreeNode(value: string, data: SysDictTreeNode) {
  if (!value) {
    return true
  }
  return data.name?.includes(value) || data.code?.includes(value)
}

function findNodeName(nodes: SysDictTreeNode[], id: number): string {
  for (const node of nodes) {
    if (node.id === id) {
      return node.name
    }
    if (node.children?.length) {
      const found = findNodeName(node.children, id)
      if (found) {
        return found
      }
    }
  }
  return ''
}

async function loadDictTree() {
  tableLoading.value = true
  try {
    const response = await getDictTree()
    dictTree.value = response.data
    if (!currentNode.value && dictTree.value.length > 0) {
      currentNode.value = dictTree.value[0] || null
    } else if (currentNode.value) {
      const currentId = currentNode.value.id
      currentNode.value = findNodeById(dictTree.value, currentId)
    }
  } finally {
    tableLoading.value = false
  }
}

function findNodeById(nodes: SysDictTreeNode[], id: number): SysDictTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    if (node.children?.length) {
      const found = findNodeById(node.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

function resetForm() {
  form.value = {
    id: 0,
    parentId: 0,
    code: '',
    name: '',
    value: '',
    sort: 1,
    remark: '',
  }
  formRef.value?.resetFields()
}

function handleNodeClick(node: SysDictTreeNode) {
  currentNode.value = node
}

function handleAddRoot() {
  resetForm()
  dialogTitle.value = '新增根节点'
  dialogVisible.value = true
}

function handleAddChild(parent?: SysDictTreeNode) {
  resetForm()
  form.value.parentId = parent?.id || currentNode.value?.id || 0
  dialogTitle.value = '新增子节点'
  dialogVisible.value = true
}

async function handleEdit(row: SysDictTreeNode) {
  resetForm()
  const response = await getDictDetail(row.id)
  form.value = {
    id: response.data.id,
    parentId: response.data.parentId || 0,
    code: response.data.code || '',
    name: response.data.name,
    value: response.data.value || '',
    sort: response.data.sort || 1,
    remark: response.data.remark || '',
  }
  dialogTitle.value = '编辑字典节点'
  dialogVisible.value = true
}

async function handleDelete(row: SysDictTreeNode) {
  ElMessageBox.confirm('确定要删除该字典节点吗？如存在子节点，后端可能会拒绝删除。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteDicts([row.id], false)
    ElMessage.success('删除成功')
    if (currentNode.value?.id === row.id) {
      currentNode.value = null
    }
    await loadDictTree()
  }).catch(() => {
    // 用户取消
  })
}

async function handleSubmit() {
  if (!formRef.value) {
    return
  }
  try {
    await formRef.value.validate()
    const payload = {
      id: form.value.id || undefined,
      parentId: form.value.parentId || undefined,
      code: form.value.code,
      name: form.value.name,
      value: form.value.value || undefined,
      sort: form.value.sort,
      remark: form.value.remark || undefined,
    }

    if (form.value.id) {
      await updateDict(payload)
      ElMessage.success('编辑成功')
    } else {
      await createDict(payload)
      ElMessage.success('新增成功')
    }

    dialogVisible.value = false
    await loadDictTree()
  } catch {
    // 表单校验失败或请求失败时保持当前弹窗
  }
}

function handleDialogClose() {
  resetForm()
}

watch(treeFilterText, (value) => {
  treeRef.value?.filter(value)
})

void loadDictTree()
</script>

<style scoped>
.dict-manage-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px;
}

.dict-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.dict-tree-panel,
.dict-detail-panel {
  min-height: 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}

.dict-tree-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.tree-content :deep(.el-tree-node__content) {
  width: 100%;
}

.tree-content :deep(.el-tree) {
  min-width: max-content;
}

.tree-header,
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.tree-node-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tree-node-label {
  flex: 1 0 auto;
  white-space: nowrap;
}

.tree-node-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.tree-header h3,
.detail-header h3 {
  margin: 0;
  font-size: 16px;
  white-space: nowrap;
}

.tree-node-row:hover .tree-node-actions,
.tree-node-row:focus-within .tree-node-actions {
  opacity: 1;
  pointer-events: auto;
}

.tree-action-btn {
  padding: 0;
  min-height: auto;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.node-detail-card {
  margin-bottom: 16px;
}

.detail-subheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-subheader h3 {
  margin: 0;
  font-size: 16px;
  white-space: nowrap;
}
</style>
