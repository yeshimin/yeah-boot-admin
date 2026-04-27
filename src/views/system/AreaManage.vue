<template>
  <div class="area-manage-container">
    <div class="action-bar">
      <div class="action-buttons">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button @click="loadAreaTree">
          <el-icon><Refresh /></el-icon>刷新树
        </el-button>
      </div>
    </div>

    <div class="area-layout">
      <div class="area-tree-panel">
        <div class="tree-header">
          <h3>地区树</h3>
          <el-input
            v-model="treeFilterText"
            placeholder="按名称或编码过滤"
            clearable
            size="small"
          />
        </div>

        <div class="tree-content">
          <el-tree
            v-loading="treeLoading"
            ref="treeRef"
            :data="areaTree"
            node-key="id"
            :props="treeProps"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            :filter-node-method="filterTreeNode"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <div class="tree-node-row">
                <span class="tree-node-label">{{ data.name }}</span>
                <el-tag size="small" effect="plain">{{ data.level === 1 ? '省份' : '城市' }}</el-tag>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <div class="area-detail-panel">
        <div class="detail-header">
          <h3>当前节点</h3>
          <div class="detail-actions" v-if="currentNode">
            <el-button size="small" type="primary" @click="handleEdit(currentNode)">编辑</el-button>
            <el-button
              v-if="currentNode.level === 1"
              size="small"
              @click="handleAdd(currentNode)"
            >
              新增
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(currentNode)">删除</el-button>
          </div>
        </div>

        <el-descriptions
          v-if="displayNode"
          v-loading="detailLoading"
          :column="1"
          border
          class="node-detail-card"
        >
          <el-descriptions-item label="类型">
            {{ displayNode.level === 1 ? '省份' : displayNode.level === 2 ? '城市' : '区县' }}
          </el-descriptions-item>
          <el-descriptions-item label="名称">{{ displayNode.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="编码">{{ displayNode.code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上级省份">
            {{ displayNode.level === 1 ? '-' : currentProvince?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ displayNode.createTime || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="请选择左侧地区节点" :image-size="88" />

        <div class="detail-subheader">
          <h3>下级区域</h3>
        </div>

        <el-table
          v-loading="childLoading"
          :data="tableRows"
          row-key="id"
          border
          table-layout="fixed"
          class="child-table"
          style="width: 100%"
          :empty-text="childEmptyText"
        >
          <el-table-column prop="level" label="类型" width="68">
            <template #default="{ row }">
              {{ row.level === 2 ? '城市' : row.level === 3 ? '区县' : '省份' }}
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="100" show-overflow-tooltip />
          <el-table-column prop="code" label="编码" width="96" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="176" show-overflow-tooltip />
          <el-table-column label="操作" width="104">
            <template #default="{ row }">
              <div class="child-row-actions">
                <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
              </div>
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
        <el-form-item label="节点类型">
          <el-input :model-value="formTypeLabel" disabled />
        </el-form-item>
        <el-form-item label="上级节点" prop="parentCode">
          <el-tree-select
            v-model="form.parentCode"
            :data="parentTreeOptions"
            :props="parentTreeProps"
            value-key="id"
            check-strictly
            default-expand-all
            placeholder="请选择上级节点"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入编码" />
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
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { ElTree, FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCity,
  createDistrict,
  createProvince,
  deleteCities,
  deleteDistricts,
  deleteProvinces,
  getAreaTree,
  getCityDetail,
  getDistrictDetail,
  getProvinceDetail,
  queryCities,
  queryDistricts,
  updateCity,
  updateDistrict,
  updateProvince,
} from '@/api/area'
import type { AreaFormModel, AreaNodeLevel, AreaTreeNode } from '@/types/area'
import { buildConditions } from '@/utils/query'

type UnknownRecord = Record<string, unknown>
const ROOT_PARENT_CODE = '__ROOT__'

const treeRef = ref<InstanceType<typeof ElTree>>()
const formRef = ref<FormInstance>()
const areaTree = ref<AreaTreeNode[]>([])
const currentNode = ref<AreaTreeNode | null>(null)
const currentNodeDetail = ref<AreaTreeNode | null>(null)
const tableRows = ref<AreaTreeNode[]>([])
const treeFilterText = ref('')
const treeLoading = ref(false)
const detailLoading = ref(false)
const childLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增')
const editingLevel = ref<AreaNodeLevel>(1)
const dialogMode = ref<'create' | 'edit'>('create')
let currentContextRequestId = 0

const treeProps = {
  children: 'children',
  label: 'name',
}

const parentTreeProps = {
  children: 'children',
  label: 'name',
  disabled: 'disabled',
}

const createDefaultForm = (): AreaFormModel => ({
  id: 0,
  parentCode: ROOT_PARENT_CODE,
  name: '',
  code: '',
})

const form = reactive(createDefaultForm())

const formRules = reactive<FormRules>({
  parentCode: [
    {
      validator: (_rule, value, callback) => {
        const nextLevel = dialogMode.value === 'create'
          ? (value && value !== ROOT_PARENT_CODE ? 2 : 1)
          : editingLevel.value
        if (nextLevel === 2 && (!value || value === ROOT_PARENT_CODE)) {
          callback(new Error('请选择父节点'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' },
  ],
})

function toNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }
  return 0
}

function toText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function normalizeAreaNode(node: unknown, level: AreaNodeLevel, parentId = 0): AreaTreeNode {
  const raw = (node || {}) as UnknownRecord
  const currentId = toNumber(raw.id, raw.provinceId, raw.cityId, raw.districtId, raw.countyId)
  const nextLevel = Math.min(level + 1, 3) as AreaNodeLevel
  const currentCode = toText(raw.code, raw.areaCode, raw.provinceCode, raw.cityCode, raw.districtCode, raw.countyCode, raw.adcode)
  const children = Array.isArray(raw.children)
    ? raw.children.map((child) => normalizeAreaNode(child, nextLevel, currentId))
    : []

  return {
    id: currentId,
    name: toText(raw.name, raw.provinceName, raw.cityName, raw.label),
    level,
    code: currentCode,
    parentCode: level === 1 ? '' : toText(raw.parentCode) || undefined,
    createTime: toText(raw.createTime, raw.gmtCreate),
    children,
  }
}

function normalizeAreaTree(nodes: unknown[]) {
  return nodes.map((node) => normalizeAreaNode(node, 1))
}

function normalizeAreaListRows(nodes: unknown[], level: AreaNodeLevel, parentId = 0) {
  return nodes.map((node) => normalizeAreaNode(node, level, parentId))
}

function findNodeById(nodes: AreaTreeNode[], id: number): AreaTreeNode | null {
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

function findNodeByCode(nodes: AreaTreeNode[], code?: string): AreaTreeNode | null {
  if (!code) {
    return null
  }
  for (const node of nodes) {
    if (node.code === code) {
      return node
    }
    if (node.children?.length) {
      const found = findNodeByCode(node.children, code)
      if (found) {
        return found
      }
    }
  }
  return null
}

const currentProvince = computed(() => {
  const activeNode = displayNode.value || currentNode.value
  if (!activeNode) {
    return null
  }
  if (activeNode.level === 1) {
    return activeNode
  }
  return findNodeByCode(areaTree.value, activeNode.parentCode)
})

const displayNode = computed(() => currentNodeDetail.value || currentNode.value)
const formTypeLabel = computed(() => {
  if (dialogMode.value === 'create') {
    const parentNode = form.parentCode && form.parentCode !== ROOT_PARENT_CODE
      ? findNodeByCode(areaTree.value, form.parentCode)
      : null
    if (!parentNode) {
      return '省份'
    }
    return parentNode.level === 1 ? '城市' : '区县'
  }
  return editingLevel.value === 1 ? '省份' : editingLevel.value === 2 ? '城市' : '区县'
})
const childEmptyText = computed(() => {
  if (!currentNode.value) {
    return '请先选择左侧地区节点'
  }
  return currentNode.value.level === 1 ? '当前省份没有下级城市数据' : '当前城市没有下级区县数据'
})

type ParentTreeOption = {
  id: string
  name: string
  disabled?: boolean
  children?: ParentTreeOption[]
}

const parentTreeOptions = computed<ParentTreeOption[]>(() => [
  {
    id: ROOT_PARENT_CODE,
    name: '根节点',
    disabled: dialogMode.value === 'edit' && editingLevel.value !== 1,
    children: areaTree.value.map((province) => ({
      id: province.code || String(province.id),
      name: province.name,
      disabled: dialogMode.value === 'edit' && editingLevel.value !== 2,
      children: (province.children || []).map((city) => ({
        id: city.code || String(city.id),
        name: city.name,
        disabled: dialogMode.value === 'edit' && editingLevel.value !== 3,
      })),
    })),
  },
])

function filterTreeNode(value: string, data: AreaTreeNode) {
  if (!value) {
    return true
  }
  return data.name.includes(value) || (data.code || '').includes(value)
}

async function loadAreaTree() {
  treeLoading.value = true
  try {
    const response = await getAreaTree(2)
    areaTree.value = normalizeAreaTree(response.data || [])
    if (!currentNode.value && areaTree.value.length) {
      currentNode.value = areaTree.value[0] || null
    } else if (currentNode.value) {
      currentNode.value = findNodeById(areaTree.value, currentNode.value.id)
      if (!currentNode.value) {
        currentNode.value = areaTree.value[0] || null
      }
    }

    if (currentNode.value) {
      await loadCurrentNodeContext(currentNode.value)
    } else {
      currentNodeDetail.value = null
      tableRows.value = []
    }
  } finally {
    treeLoading.value = false
  }
}

function resetForm() {
  Object.assign(form, createDefaultForm())
  formRef.value?.clearValidate()
}

function handleNodeClick(node: AreaTreeNode) {
  currentNode.value = node
  void loadCurrentNodeContext(node)
}

function handleAdd(node?: AreaTreeNode) {
  resetForm()
  dialogMode.value = 'create'
  editingLevel.value = 1
  form.parentCode = node?.code || currentNode.value?.code || ROOT_PARENT_CODE
  dialogTitle.value = '新增'
  dialogVisible.value = true
}

function normalizeAreaDetail(detail: Record<string, unknown>, level: AreaNodeLevel) {
  return {
    id: toNumber(detail.id, detail.provinceId, detail.cityId, detail.districtId, detail.countyId),
    parentCode: level === 1 ? ROOT_PARENT_CODE : toText(detail.parentCode) || ROOT_PARENT_CODE,
    name: toText(detail.name, detail.provinceName, detail.cityName, detail.districtName, detail.countyName),
    code: toText(detail.code, detail.areaCode, detail.provinceCode, detail.cityCode, detail.districtCode, detail.countyCode, detail.adcode),
    createTime: toText(detail.createTime, detail.gmtCreate),
    level,
  }
}

async function fetchCurrentNodeDetail(node: AreaTreeNode) {
  if (node.level === 1) {
    const response = await getProvinceDetail(node.id)
    return normalizeAreaDetail(response.data, 1)
  }

  const response = await getCityDetail(node.id)
  return normalizeAreaDetail(response.data, 2)
}

async function fetchChildRows(node: AreaTreeNode, parentCode?: string) {
  const code = parentCode || node.code
  if (!code) {
    return []
  }

  if (node.level === 1) {
    const response = await queryCities({
      current: 1,
      size: 1000,
      conditions_: buildConditions([
        { field: 'parentCode', operator: 'eq', value: code },
      ]),
    })
    return normalizeAreaListRows(response.data.records || [], 2, node.id)
  }

  const response = await queryDistricts({
    current: 1,
    size: 1000,
    conditions_: buildConditions([
      { field: 'parentCode', operator: 'eq', value: code },
    ]),
  })
  return normalizeAreaListRows(response.data.records || [], 3, node.id)
}

async function loadCurrentNodeContext(node: AreaTreeNode) {
  const requestId = ++currentContextRequestId
  detailLoading.value = true
  childLoading.value = true

  const detailResult = await Promise.allSettled([fetchCurrentNodeDetail(node)])

  if (requestId !== currentContextRequestId) {
    return
  }

  const detailNode = detailResult[0]?.status === 'fulfilled' ? detailResult[0].value : node
  currentNodeDetail.value = detailNode
  detailLoading.value = false

  const childResult = await Promise.allSettled([fetchChildRows(node, detailNode.code)])

  if (requestId !== currentContextRequestId) {
    return
  }

  tableRows.value = childResult[0]?.status === 'fulfilled' ? childResult[0].value : []
  childLoading.value = false
}

async function handleEdit(node: AreaTreeNode) {
  resetForm()
  dialogMode.value = 'edit'
  editingLevel.value = node.level

  if (node.level === 1) {
    const response = await getProvinceDetail(node.id)
    Object.assign(form, normalizeAreaDetail(response.data, 1))
    dialogTitle.value = '编辑'
  } else if (node.level === 2) {
    const response = await getCityDetail(node.id)
    Object.assign(form, normalizeAreaDetail(response.data, 2))
    dialogTitle.value = '编辑'
  } else {
    const response = await getDistrictDetail(node.id)
    Object.assign(form, normalizeAreaDetail(response.data, 3))
    dialogTitle.value = '编辑'
  }

  dialogVisible.value = true
}

async function handleDelete(node: AreaTreeNode) {
  ElMessageBox.confirm(`确定要删除该${node.level === 1 ? '省份' : node.level === 2 ? '城市' : '区县'}吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    if (node.level === 1) {
      await deleteProvinces([node.id])
      ElMessage.success('删除省份成功')
    } else if (node.level === 2) {
      await deleteCities([node.id])
      ElMessage.success('删除城市成功')
    } else {
      await deleteDistricts([node.id])
      ElMessage.success('删除区县成功')
    }

    if (currentNode.value?.id === node.id) {
      currentNode.value = null
      currentNodeDetail.value = null
      tableRows.value = []
    }
    await loadAreaTree()
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

    const selectedParentNode = form.parentCode && form.parentCode !== ROOT_PARENT_CODE
      ? findNodeByCode(areaTree.value, form.parentCode)
      : null
    const submitLevel = dialogMode.value === 'create'
      ? (!selectedParentNode ? 1 : selectedParentNode.level === 1 ? 2 : 3)
      : editingLevel.value

    if (submitLevel === 1) {
      const payload = {
        id: form.id || undefined,
        name: form.name,
        code: form.code || undefined,
        parentCode: undefined,
      }

      if (form.id) {
        await updateProvince(payload)
        ElMessage.success('编辑省份成功')
      } else {
        await createProvince(payload)
        ElMessage.success('新增省份成功')
      }
    } else if (submitLevel === 2) {
      const payload = {
        id: form.id || undefined,
        parentCode: form.parentCode === ROOT_PARENT_CODE ? undefined : form.parentCode,
        name: form.name,
        code: form.code || undefined,
      }

      if (form.id) {
        await updateCity(payload)
        ElMessage.success('编辑城市成功')
      } else {
        await createCity(payload)
        ElMessage.success('新增城市成功')
      }
    } else {
      const payload = {
        id: form.id || undefined,
        parentCode: form.parentCode === ROOT_PARENT_CODE ? undefined : form.parentCode,
        name: form.name,
        code: form.code || undefined,
      }

      if (form.id) {
        await updateDistrict(payload)
        ElMessage.success('编辑区县成功')
      } else {
        await createDistrict(payload)
        ElMessage.success('新增区县成功')
      }
    }

    dialogVisible.value = false
    await loadAreaTree()
  } catch {
    // 表单校验失败或请求失败时保持当前弹窗
  }
}

function handleDialogClose() {
  resetForm()
  dialogMode.value = 'create'
  editingLevel.value = 1
}

watch(treeFilterText, (value) => {
  treeRef.value?.filter(value)
})

void loadAreaTree()
</script>

<style scoped>
.area-manage-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px;
}

.area-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
}

.area-tree-panel,
.area-detail-panel {
  min-width: 0;
  min-height: 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}

.area-tree-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.area-detail-panel {
  overflow: hidden;
}

.tree-header,
.detail-header,
.detail-subheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.tree-header h3,
.detail-header h3,
.detail-subheader h3 {
  margin: 0;
  font-size: 16px;
  white-space: nowrap;
}

.tree-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
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

.detail-actions {
  display: flex;
  gap: 8px;
}

.node-detail-card {
  margin-bottom: 16px;
}

.child-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.child-row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.child-row-actions :deep(.el-button) {
  min-width: 0;
  margin-left: 0;
}

@media (max-width: 992px) {
  .area-layout {
    grid-template-columns: 1fr;
  }
}
</style>
