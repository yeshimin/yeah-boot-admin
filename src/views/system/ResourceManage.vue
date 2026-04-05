<template>
  <div class="resource-manage-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="资源名称">
          <el-input v-model="searchForm.name" placeholder="请输入资源名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="searchForm.type" placeholder="请选择资源类型" clearable>
            <el-option label="菜单" :value="1"></el-option>
            <el-option label="页面" :value="2"></el-option>
            <el-option label="按钮" :value="3"></el-option>
            <el-option label="接口" :value="4"></el-option>
          </el-select>
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
          v-if="authStore.canAction('/system/resource', { names: ['新增资源', '新增菜单', '新增'], permissions: ['admin:sysRes:create', 'admin:sysRes:crud:create'] })"
          type="primary"
          @click="handleAddResource"
        >
          <el-icon><Plus /></el-icon>新增菜单
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        v-loading="tableLoading"
        :data="resourceList"
        stripe
        row-key="id"
        style="width: 100%"
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="name" label="资源名称" min-width="120"></el-table-column>
        <el-table-column prop="type" label="资源类型" min-width="100">
          <template #default="scope">
            <el-tag :type="getResourceTypeTagType(scope.row.type)">
              {{ getResourceTypeName(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="150"></el-table-column>
        <el-table-column prop="permission" label="权限标识" min-width="150"></el-table-column>
        <el-table-column prop="sort" label="排序" min-width="80"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="1"
              inactive-value="2"
              :disabled="
                !authStore.canAction('/system/resource', {
                  names: ['编辑资源', '编辑菜单', '编辑'],
                  permissions: ['admin:sysRes:update', 'admin:sysRes:crud:update'],
                })
              "
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button
              v-if="authStore.canAction('/system/resource', { names: ['编辑资源', '编辑菜单', '编辑'], permissions: ['admin:sysRes:update', 'admin:sysRes:crud:update'] })"
              type="primary"
              size="small"
              @click="handleEditResource(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="authStore.canAction('/system/resource', { names: ['删除资源', '删除菜单', '删除'], permissions: ['admin:sysRes:delete', 'admin:sysRes:crud:delete'] })"
              type="danger"
              size="small"
              @click="handleDeleteResource(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑资源弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      @close="handleDialogClose"
    >
      <el-form
        ref="resourceFormRef"
        :model="resourceForm"
        :rules="resourceRules"
        label-width="100px"
      >
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="resourceForm.parentId"
            :data="parentOptions"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            value-key="id"
            check-strictly
            default-expand-all
            placeholder="请选择上级菜单"
          />
        </el-form-item>
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="resourceForm.name" placeholder="请输入资源名称"></el-input>
        </el-form-item>
        <el-form-item label="资源类型" prop="type">
          <el-select v-model="resourceForm.type" placeholder="请选择资源类型">
            <el-option label="菜单" :value="1"></el-option>
            <el-option label="页面" :value="2"></el-option>
            <el-option label="按钮" :value="3"></el-option>
            <el-option label="接口" :value="4"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="resourceForm.path" placeholder="请输入路径"></el-input>
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="resourceForm.component" placeholder="请输入前端组件路径"></el-input>
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-popover placement="bottom-start" :width="420" trigger="click">
            <template #reference>
              <el-input v-model="resourceForm.icon" placeholder="点击选择图标" readonly>
                <template #prefix>
                  <el-icon v-if="resourceForm.icon">
                    <component :is="resourceForm.icon" />
                  </el-icon>
                  <el-icon v-else><Grid /></el-icon>
                </template>
              </el-input>
            </template>
            <IconSelectPopover v-model="resourceForm.icon" :icons="availableIcons" />
          </el-popover>
        </el-form-item>
        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="resourceForm.permission" placeholder="请输入权限标识"></el-input>
        </el-form-item>
        <el-form-item label="外链" prop="isLink">
          <el-switch v-model="resourceForm.isLink"></el-switch>
        </el-form-item>
        <el-form-item label="外链地址" prop="linkUrl" v-if="resourceForm.isLink">
          <el-input v-model="resourceForm.linkUrl" placeholder="请输入外链地址"></el-input>
        </el-form-item>
        <el-form-item label="可见" prop="visible">
          <el-switch v-model="resourceForm.visible"></el-switch>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="resourceForm.sort" :min="1" :max="999"></el-input-number>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="resourceForm.status" active-value="1" inactive-value="2"></el-switch>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="resourceForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitResource">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Grid } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import IconSelectPopover from '@/components/layout/IconSelectPopover.vue'
import {
  createResource,
  deleteResources,
  getResourceDetail,
  getResourceTree,
  updateResource,
} from '@/api/upms'
import type { ResourceTreeNode } from '@/types/upms'
import { buildConditions } from '@/utils/query'

const authStore = useAuthStore()
const availableIcons = [
  'Setting',
  'User',
  'Avatar',
  'Menu',
  'OfficeBuilding',
  'Briefcase',
  'Collection',
  'Document',
  'Monitor',
  'Odometer',
  'Grid',
  'Tools',
  'Link',
  'Folder',
  'Bell',
  'ShoppingCart',
]

// 表格加载状态
const tableLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '' as '' | number,
  status: ''
})

const parentOptions = ref<any[]>([])

// 资源列表数据
const resourceList = ref<any[]>([])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增菜单')

// 资源表单引用
const resourceFormRef = ref<FormInstance>()

// 资源表单数据
const resourceForm = reactive({
  id: 0,
  parentId: 0,
  name: '',
  type: 1,
  path: '',
  component: '',
  icon: '',
  permission: '',
  isLink: false,
  linkUrl: '',
  visible: true,
  sort: 1,
  status: '1',
  remark: '',
})

// 资源表单验证规则
const resourceRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入资源名称', trigger: 'blur' },
    { min: 2, max: 50, message: '资源名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择资源类型', trigger: 'change' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
})

const loadParentOptions = async () => {
  const response = await getResourceTree()
  parentOptions.value = [
    {
      id: 0,
      name: '根菜单',
      children: response.data,
    },
  ]
}

// 页面加载时获取资源列表
onMounted(() => {
  void Promise.all([loadParentOptions(), getResourceList()])
})

// 获取资源列表
const getResourceList = async () => {
  tableLoading.value = true
  try {
    const response = await getResourceTree({
      conditions_: buildConditions([
        { field: 'name', operator: 'like', value: searchForm.name },
      ]),
      status: searchForm.status || undefined,
    })

    const filteredTree = (nodes: ResourceTreeNode[]): ResourceTreeNode[] => {
      return nodes
        .map((node) => ({
          ...node,
          children: node.children ? filteredTree(node.children) : [],
        }))
        .filter((node) => {
          const matchesType = !searchForm.type || node.type === searchForm.type
          return matchesType || (node.children?.length ?? 0) > 0
        })
    }

    resourceList.value = filteredTree(response.data)
  } finally {
    tableLoading.value = false
  }
}

// 搜索资源
const handleSearch = async () => {
  await getResourceList()
}

// 重置搜索表单
const handleReset = async () => {
  Object.assign(searchForm, {
    name: '',
    type: '',
    status: ''
  })
  await getResourceList()
}

// 新增资源
const handleAddResource = () => {
  dialogTitle.value = '新增菜单'
  resetResourceForm()
  resourceForm.parentId = 0
  dialogVisible.value = true
}

// 编辑资源
const handleEditResource = async (row: any) => {
  dialogTitle.value = '编辑菜单'
  const response = await getResourceDetail(row.id)
  Object.assign(resourceForm, {
    id: response.data.id,
    parentId: Number(response.data.parentId ?? 0),
    name: response.data.name,
    type: response.data.type,
    path: response.data.path || '',
    component: response.data.component || '',
    icon: response.data.icon || '',
    permission: response.data.permission || '',
    isLink: response.data.isLink || false,
    linkUrl: response.data.linkUrl || '',
    visible: response.data.visible ?? true,
    sort: response.data.sort || 1,
    status: response.data.status || '1',
    remark: response.data.remark || '',
  })
  dialogVisible.value = true
}

// 删除资源
const handleDeleteResource = async (row: any) => {
  ElMessageBox.confirm('确定要删除该资源吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteResources([row.id])
    ElMessage.success('删除成功')
    await Promise.all([loadParentOptions(), getResourceList()])
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = async (row: any) => {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  try {
    await updateResource({
      id: row.id,
      status: nextStatus,
    })
    ElMessage.success(`资源${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch {
    row.status = previousStatus
  }
}

// 提交资源表单
const handleSubmitResource = async () => {
  if (!resourceFormRef.value) return
  try {
    await resourceFormRef.value.validate()
    const payload = {
      id: resourceForm.id || undefined,
      parentId: resourceForm.parentId,
      name: resourceForm.name,
      type: resourceForm.type,
      path: resourceForm.path || undefined,
      component: resourceForm.component || undefined,
      icon: resourceForm.icon || undefined,
      permission: resourceForm.permission || undefined,
      isLink: resourceForm.isLink,
      linkUrl: resourceForm.linkUrl || undefined,
      visible: resourceForm.visible,
      sort: resourceForm.sort,
      status: resourceForm.status,
      remark: resourceForm.remark || undefined,
    }

    if (resourceForm.id) {
      await updateResource(payload)
      ElMessage.success('编辑菜单成功')
    } else {
      await createResource(payload)
      ElMessage.success('新增菜单成功')
    }
    dialogVisible.value = false
    await Promise.all([loadParentOptions(), getResourceList()])
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置资源表单
const resetResourceForm = () => {
  Object.assign(resourceForm, {
    id: 0,
    parentId: 0,
    name: '',
    type: 1,
    path: '',
    component: '',
    icon: '',
    permission: '',
    isLink: false,
    linkUrl: '',
    visible: true,
    sort: 1,
    status: '1',
    remark: '',
  })
  if (resourceFormRef.value) {
    resourceFormRef.value.clearValidate()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetResourceForm()
}

// 获取资源类型名称
const getResourceTypeName = (type: number | string) => {
  const typeMap: Record<string, string> = {
    '1': '菜单',
    '2': '页面',
    '3': '按钮',
    '4': '接口',
    menu: '菜单',
    button: '按钮',
    api: '接口'
  }
  return typeMap[String(type)] || String(type)
}

// 获取资源类型标签类型
const getResourceTypeTagType = (type: number | string) => {
  const typeMap: Record<string, string> = {
    '1': 'primary',
    '2': 'success',
    '3': 'warning',
    '4': 'info',
    menu: 'primary',
    button: 'warning',
    api: 'info'
  }
  return typeMap[String(type)] || 'info'
}
</script>

<style scoped>
.resource-manage-container {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
