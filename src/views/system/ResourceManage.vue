<template>
  <div class="resource-manage-container">
    <el-tabs v-model="activeTab" class="resource-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="视图资源" name="view">
        <div class="search-bar">
          <el-form :inline="true" :model="viewSearchForm" class="search-form">
            <el-form-item label="资源名称">
              <el-input v-model="viewSearchForm.name" placeholder="请输入资源名称" clearable></el-input>
            </el-form-item>
            <el-form-item label="资源类型">
              <el-select v-model="viewSearchForm.type" placeholder="请选择资源类型" clearable>
                <el-option label="菜单" :value="RESOURCE_TYPE.MENU"></el-option>
                <el-option label="页面" :value="RESOURCE_TYPE.PAGE"></el-option>
                <el-option label="按钮" :value="RESOURCE_TYPE.BUTTON"></el-option>
                <el-option label="分组" :value="RESOURCE_TYPE.GROUP"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="viewSearchForm.status" placeholder="请选择状态" clearable>
                <el-option label="启用" value="1"></el-option>
                <el-option label="禁用" value="2"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleViewSearch">搜索</el-button>
              <el-button @click="handleViewReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="action-bar">
          <div class="action-buttons">
            <el-button
              v-if="canCreateResource"
              type="primary"
              @click="handleAddViewResource"
            >
              <el-icon><Plus /></el-icon>新增视图资源
            </el-button>
          </div>
        </div>

        <div class="table-container">
          <el-table
            v-loading="viewTableLoading"
            :data="viewResourceList"
            stripe
            :row-key="getResourceRowKey"
            style="width: 100%"
            default-expand-all
            :tree-props="{ children: 'children' }"
          >
            <el-table-column prop="name" label="资源名称" min-width="150"></el-table-column>
            <el-table-column prop="type" label="资源类型" min-width="100">
              <template #default="scope">
                <el-tag :type="getResourceTypeTagType(scope.row.type)">
                  {{ getResourceTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="path" label="路径" min-width="150"></el-table-column>
            <el-table-column prop="permission" label="权限标识" min-width="170"></el-table-column>
            <el-table-column prop="sort" label="排序" min-width="80"></el-table-column>
            <el-table-column prop="status" label="状态" min-width="90">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  active-value="1"
                  inactive-value="2"
                  :disabled="!canUpdateResource"
                  @change="handleResourceStatusChange(scope.row)"
                ></el-switch>
              </template>
            </el-table-column>
            <el-table-column v-if="hasViewRowActions" label="操作" min-width="220" fixed="right">
              <template #default="scope">
                <el-button
                  v-if="canUpdateResource"
                  type="primary"
                  size="small"
                  @click="handleEditResource(scope.row, 'view')"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="canMountResource"
                  type="success"
                  size="small"
                  @click="handleMountApis(scope.row)"
                >
                  挂载接口
                </el-button>
                <el-button
                  v-if="canDeleteResource"
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
      </el-tab-pane>

      <el-tab-pane label="接口资源" name="api">
        <div class="search-bar">
          <el-form :inline="true" :model="apiSearchForm" class="search-form">
            <el-form-item label="接口名称">
              <el-input v-model="apiSearchForm.name" placeholder="请输入接口名称" clearable></el-input>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="apiSearchForm.status" placeholder="请选择状态" clearable>
                <el-option label="启用" value="1"></el-option>
                <el-option label="禁用" value="2"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleApiSearch">搜索</el-button>
              <el-button @click="handleApiReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="action-bar">
          <div class="action-buttons">
            <el-button
              v-if="canCreateResourceGroup"
              type="primary"
              @click="handleAddApiGroup()"
            >
              <el-icon><Plus /></el-icon>新增接口分组
            </el-button>
            <el-button
              v-if="canCreateResource"
              type="success"
              @click="handleAddApiResource()"
            >
              <el-icon><Plus /></el-icon>新增接口资源
            </el-button>
          </div>
        </div>

        <div class="table-container">
          <el-table
            v-loading="apiTableLoading"
            :data="apiResourceList"
            stripe
            :row-key="getResourceRowKey"
            style="width: 100%"
            default-expand-all
            :tree-props="{ children: 'children' }"
          >
            <el-table-column prop="name" label="名称" min-width="160">
              <template #default="scope">
                {{ formatDisabledName(scope.row.name, scope.row.status) }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" min-width="100">
              <template #default="scope">
                <el-tag :type="getResourceTypeTagType(scope.row.type)">
                  {{ getResourceTypeName(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="permission" label="权限标识" min-width="220"></el-table-column>
            <el-table-column prop="sort" label="排序" min-width="80"></el-table-column>
            <el-table-column prop="status" label="状态" min-width="90">
              <template #default="scope">
                <span v-if="isApiGroupRow(scope.row)">-</span>
                <el-switch
                  v-else
                  v-model="scope.row.status"
                  active-value="1"
                  inactive-value="2"
                  :disabled="!canUpdateResource"
                  @change="handleResourceStatusChange(scope.row)"
                ></el-switch>
              </template>
            </el-table-column>
            <el-table-column v-if="hasApiRowActions" label="操作" min-width="260" fixed="right">
              <template #default="scope">
                <template v-if="isApiGroupRow(scope.row)">
                  <el-button
                    v-if="canCreateResourceGroup && !isUngroupedApiGroup(scope.row)"
                    type="primary"
                    size="small"
                    @click="handleAddApiGroup(scope.row)"
                  >
                    新增子分组
                  </el-button>
                  <el-button
                    v-if="canCreateResource"
                    type="success"
                    size="small"
                    @click="handleAddApiResource(scope.row)"
                  >
                    新增接口
                  </el-button>
                  <el-button
                    v-if="canUpdateResourceGroup && !isUngroupedApiGroup(scope.row)"
                    type="primary"
                    size="small"
                    @click="handleEditApiGroup(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="canDeleteResourceGroup && !isUngroupedApiGroup(scope.row)"
                    type="danger"
                    size="small"
                    @click="handleDeleteApiGroup(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    v-if="canUpdateResource"
                    type="primary"
                    size="small"
                    @click="handleEditResource(scope.row, 'api')"
                  >
                    编辑
                  </el-button>
                  <el-button
                    v-if="canDeleteResource"
                    type="danger"
                    size="small"
                    @click="handleDeleteResource(scope.row)"
                  >
                    删除
                  </el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑资源弹窗 -->
    <el-dialog
      v-model="resourceDialogVisible"
      :title="resourceDialogTitle"
      width="640px"
      :close-on-click-modal="!resourceFormSubmitting"
      :close-on-press-escape="!resourceFormSubmitting"
      :show-close="!resourceFormSubmitting"
      @closed="handleResourceDialogClose"
    >
      <el-form
        ref="resourceFormRef"
        :model="resourceForm"
        :rules="resourceRules"
        label-width="110px"
      >
        <el-form-item v-if="!isApiFormResource" label="上级资源" prop="parentId">
          <el-tree-select
            v-model="resourceForm.parentId"
            :data="parentOptions"
            :props="treeSelectProps"
            value-key="id"
            check-strictly
            default-expand-all
            placeholder="请选择上级资源"
          />
        </el-form-item>
        <el-form-item v-if="isApiFormResource" label="接口分组" prop="groupId">
          <el-tree-select
            v-model="resourceForm.groupId"
            :data="apiGroupOptions"
            :props="treeSelectProps"
            value-key="id"
            check-strictly
            default-expand-all
            placeholder="请选择接口分组"
          />
        </el-form-item>
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="resourceForm.name" placeholder="请输入资源名称"></el-input>
        </el-form-item>
        <el-form-item label="资源类型" prop="type">
          <el-select
            v-model="resourceForm.type"
            placeholder="请选择资源类型"
            :disabled="resourceDialogMode === 'api'"
          >
            <el-option
              v-for="item in resourceTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="isRouteResource" label="路径" prop="path">
          <el-input v-model="resourceForm.path" placeholder="请输入路径"></el-input>
        </el-form-item>
        <el-form-item v-if="isRouteResource && !resourceForm.isLink" label="组件" prop="component">
          <el-input v-model="resourceForm.component" placeholder="请输入前端组件路径"></el-input>
        </el-form-item>
        <el-form-item v-if="isRouteResource" label="图标" prop="icon">
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
        <el-form-item
          v-if="isPermissionResource"
          label="权限标识"
          prop="permission"
          :required="isApiFormResource"
        >
          <el-input v-model="resourceForm.permission" placeholder="请输入权限标识"></el-input>
        </el-form-item>
        <el-form-item v-if="isRouteResource" label="外链" prop="isLink">
          <el-switch v-model="resourceForm.isLink"></el-switch>
        </el-form-item>
        <el-form-item v-if="isRouteResource && resourceForm.isLink" label="外链地址" prop="linkUrl">
          <el-input v-model="resourceForm.linkUrl" placeholder="请输入外链地址"></el-input>
        </el-form-item>
        <el-form-item v-if="isRouteResource" label="可见" prop="visible">
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
          <el-button :disabled="resourceFormSubmitting" @click="resourceDialogVisible = false">取消</el-button>
          <el-button
            v-if="canSubmitResourceForm"
            type="primary"
            :loading="resourceFormSubmitting"
            @click="handleSubmitResource"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/编辑接口分组弹窗 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="groupDialogTitle"
      width="520px"
      :close-on-click-modal="!groupFormSubmitting"
      :close-on-press-escape="!groupFormSubmitting"
      :show-close="!groupFormSubmitting"
      @closed="handleGroupDialogClose"
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupRules"
        label-width="100px"
      >
        <el-form-item label="上级分组" prop="parentId">
          <el-tree-select
            v-model="groupForm.parentId"
            :data="groupParentOptions"
            :props="treeSelectProps"
            value-key="id"
            check-strictly
            default-expand-all
            placeholder="请选择上级分组"
          />
        </el-form-item>
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称"></el-input>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="groupForm.sort" :min="1" :max="999"></el-input-number>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="groupForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button :disabled="groupFormSubmitting" @click="groupDialogVisible = false">取消</el-button>
          <el-button
            v-if="canSubmitGroupForm"
            type="primary"
            :loading="groupFormSubmitting"
            @click="handleSubmitGroup"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 挂载接口弹窗 -->
    <el-dialog
      v-model="mountDialogVisible"
      :title="mountDialogTitle"
      width="640px"
      :close-on-click-modal="!mountSubmitting"
      :close-on-press-escape="!mountSubmitting"
      :show-close="!mountSubmitting"
      @closed="handleMountDialogClose"
    >
      <div class="mount-tip">
        勾选后，角色授权树中会在该视图节点下展示这些接口；实际鉴权仍然写入 sys_res / sys_role_res。
      </div>
      <div class="mount-tree-container" v-loading="mountLoading">
        <el-tree
          ref="mountTreeRef"
          :data="mountApiTree"
          show-checkbox
          node-key="nodeKey"
          :props="mountTreeProps"
          :default-checked-keys="mountedApiKeys"
        ></el-tree>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button :disabled="mountSubmitting" @click="mountDialogVisible = false">取消</el-button>
          <el-button
            v-if="canSaveMountResource"
            type="primary"
            :loading="mountSubmitting"
            @click="handleSubmitMount"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { Grid, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthContextRefresh } from '@/composables/useAuthContextRefresh'
import { useAuthStore } from '@/stores/auth'
import IconSelectPopover from '@/components/layout/IconSelectPopover.vue'
import {
  RESOURCE_TYPE,
  isActionResourceType,
  isApiResourceType,
  isGroupResourceType,
  isMenuResourceType,
} from '@/constants/resource'
import {
  createResource,
  createResourceGroup,
  deleteResourceGroups,
  deleteResources,
  getApiResourceTree,
  getResourceDetail,
  getResourceGroupTree,
  getViewResourceTree,
  queryMountedApis,
  saveMountedApis,
  updateResource,
  updateResourceGroup,
} from '@/api/upms'
import type { ResourceTreeNode, SysResGroupTreeNode, SysResMountItem } from '@/types/upms'
import { getRequestErrorMessage as getErrorMessage, isUserCancel } from '@/utils/error'
import { formatDisabledName, isDisabledStatus } from '@/utils/status'

type ResourceTab = 'view' | 'api'

interface TreeSelectOption {
  id: number
  name: string
  disabled?: boolean
  children?: TreeSelectOption[]
}

const authStore = useAuthStore()
const refreshAuthContextSilently = useAuthContextRefresh()
const canCreateResource = computed(() => authStore.hasPermission('admin:sysRes:create'))
const canUpdateResource = computed(() => authStore.hasPermission('admin:sysRes:update'))
const canDeleteResource = computed(() => authStore.hasPermission('admin:sysRes:delete'))
const canCreateResourceGroup = computed(() => authStore.hasPermission('admin:sysResGroup:create'))
const canUpdateResourceGroup = computed(() => authStore.hasPermission('admin:sysResGroup:update'))
const canDeleteResourceGroup = computed(() => authStore.hasPermission('admin:sysResGroup:delete'))
const canQueryMountResource = computed(() => authStore.hasPermission('admin:sysResMount:query'))
const canSaveMountResource = computed(() => authStore.hasPermission('admin:sysResMount:save'))
const canMountResource = computed(() => canQueryMountResource.value && canSaveMountResource.value)

const activeTab = ref<ResourceTab>('view')
const viewTableLoading = ref(false)
const apiTableLoading = ref(false)
const mountLoading = ref(false)

const viewSearchForm = reactive({
  name: '',
  type: '' as '' | number,
  status: '',
})

const apiSearchForm = reactive({
  name: '',
  status: '',
})

const treeSelectProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  disabled: 'disabled',
}

const viewResourceList = ref<ResourceTreeNode[]>([])
const viewResourceTree = ref<ResourceTreeNode[]>([])
const apiResourceList = ref<ResourceTreeNode[]>([])
const apiGroupTree = ref<SysResGroupTreeNode[]>([])

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

const resourceDialogVisible = ref(false)
const resourceDialogTitle = ref('新增资源')
const resourceDialogMode = ref<ResourceTab>('view')
const resourceFormSubmitting = ref(false)
const resourceFormRef = ref<FormInstance>()
const initializingResourceForm = ref(false)
const lockedDisabledParentId = ref<number | null>(null)

const resourceForm = reactive({
  id: 0,
  parentId: 0,
  groupId: 0,
  name: '',
  type: RESOURCE_TYPE.MENU as number,
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

const groupDialogVisible = ref(false)
const groupDialogTitle = ref('新增接口分组')
const groupFormSubmitting = ref(false)
const groupFormRef = ref<FormInstance>()
const groupForm = reactive({
  id: 0,
  parentId: 0,
  name: '',
  sort: 1,
  remark: '',
})

const mountDialogVisible = ref(false)
const mountSubmitting = ref(false)
const mountTreeRef = ref<any>()
const mountTargetResource = ref<ResourceTreeNode | null>(null)
const mountApiTree = ref<ResourceTreeNode[]>([])
const mountedApiKeys = ref<string[]>([])

const resourceTypeOptions = computed(() => {
  if (resourceDialogMode.value === 'api') {
    return [
      { label: '接口', value: RESOURCE_TYPE.API },
    ]
  }
  return [
    { label: '菜单', value: RESOURCE_TYPE.MENU },
    { label: '页面', value: RESOURCE_TYPE.PAGE },
    { label: '按钮', value: RESOURCE_TYPE.BUTTON },
    { label: '分组', value: RESOURCE_TYPE.GROUP },
  ]
})

const canSubmitResourceForm = computed(() => (resourceForm.id ? canUpdateResource.value : canCreateResource.value))
const canSubmitGroupForm = computed(() => (groupForm.id ? canUpdateResourceGroup.value : canCreateResourceGroup.value))
const hasViewRowActions = computed(() => canUpdateResource.value || canDeleteResource.value || canMountResource.value)
const hasApiRowActions = computed(() => (
  canCreateResource.value
  || canUpdateResource.value
  || canDeleteResource.value
  || canCreateResourceGroup.value
  || canUpdateResourceGroup.value
  || canDeleteResourceGroup.value
))
const isRouteResource = computed(() => isMenuResourceType(resourceForm.type))
const isApiFormResource = computed(() => isApiResourceType(resourceForm.type))
const isPermissionResource = computed(() => isActionResourceType(resourceForm.type))
const currentEditingNode = computed(() => (
  resourceForm.id && resourceDialogMode.value === 'view'
    ? findResourceNodeById(viewResourceTree.value, resourceForm.id)
    : null
))
const currentEditingGroupNode = computed(() => (
  groupForm.id ? findGroupNodeById(apiGroupTree.value, groupForm.id) : null
))
const parentOptions = computed<TreeSelectOption[]>(() => [
  {
    id: 0,
    name: '顶级资源',
    children: viewResourceTree.value.map((node) => createParentOption(node, currentEditingNode.value)),
  },
])
const apiGroupOptions = computed<TreeSelectOption[]>(() => [
  {
    id: 0,
    name: '未分组',
    children: apiGroupTree.value.map((node) => createGroupOption(node, null)),
  },
])
const groupParentOptions = computed<TreeSelectOption[]>(() => [
  {
    id: 0,
    name: '顶级分组',
    children: apiGroupTree.value.map((node) => createGroupOption(node, currentEditingGroupNode.value)),
  },
])
const mountDialogTitle = computed(() => (
  mountTargetResource.value ? `挂载接口：${mountTargetResource.value.name}` : '挂载接口'
))

const resourceRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入资源名称', trigger: 'blur' },
    { min: 2, max: 50, message: '资源名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  type: [
    { required: true, message: '请选择资源类型', trigger: 'change' },
  ],
  permission: [
    {
      validator: (_rule, value, callback) => {
        if (isApiResourceType(resourceForm.type) && !value) {
          callback(new Error('接口资源必须填写权限标识'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
  ],
})

const groupRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '分组名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
  ],
})

const mountTreeProps = {
  children: 'children',
  label: formatMountTreeLabel,
  disabled: isMountTreeNodeDisabled,
}

onMounted(() => {
  void loadViewResources()
})

async function handleTabChange() {
  if (activeTab.value === 'api') {
    await Promise.all([loadApiGroups(), loadApiResources()])
    return
  }
  await loadViewResources()
}

function warnNoPermission() {
  ElMessage.warning('暂无操作权限')
}

function getResourceRowKey(row: ResourceTreeNode) {
  return row.nodeKey || `${row.type}:${row.id}`
}

function isApiGroupRow(row?: ResourceTreeNode | null) {
  return Boolean(row) && isGroupResourceType(row?.type) && !row?.resId
}

function isUngroupedApiGroup(row?: ResourceTreeNode | null) {
  return Boolean(row) && isApiGroupRow(row) && row?.id === 0
}

function loadViewResources() {
  viewTableLoading.value = true
  return getViewResourceTree()
    .then((response) => {
      viewResourceTree.value = response.data || []
      viewResourceList.value = filterViewResourceTree(viewResourceTree.value)
    })
    .finally(() => {
      viewTableLoading.value = false
    })
}

function loadApiGroups() {
  return getResourceGroupTree().then((response) => {
    apiGroupTree.value = response.data || []
  })
}

function loadApiResources() {
  apiTableLoading.value = true
  return getApiResourceTree({
    name: apiSearchForm.name || undefined,
    status: apiSearchForm.status || undefined,
  })
    .then((response) => {
      apiResourceList.value = filterApiResourceTree(response.data || [])
    })
    .finally(() => {
      apiTableLoading.value = false
    })
}

function filterViewResourceTree(nodes: ResourceTreeNode[]): ResourceTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: node.children ? filterViewResourceTree(node.children) : [],
    }))
    .filter((node) => {
      const matchesName = !viewSearchForm.name || node.name.includes(viewSearchForm.name)
      const matchesType = !viewSearchForm.type || node.type === viewSearchForm.type
      const matchesStatus = !viewSearchForm.status || node.status === viewSearchForm.status
      return (matchesName && matchesType && matchesStatus) || (node.children?.length ?? 0) > 0
    })
}

function filterApiResourceTree(nodes: ResourceTreeNode[]): ResourceTreeNode[] {
  const querying = Boolean(apiSearchForm.name || apiSearchForm.status)
  if (!querying) {
    return nodes
  }

  return nodes
    .map((node) => ({
      ...node,
      children: node.children ? filterApiResourceTree(node.children) : [],
    }))
    .filter((node) => isApiResourceType(node.type) || (node.children?.length ?? 0) > 0)
}

async function handleViewSearch() {
  viewResourceList.value = filterViewResourceTree(viewResourceTree.value)
}

async function handleViewReset() {
  Object.assign(viewSearchForm, {
    name: '',
    type: '',
    status: '',
  })
  viewResourceList.value = filterViewResourceTree(viewResourceTree.value)
}

async function handleApiSearch() {
  await loadApiResources()
}

async function handleApiReset() {
  Object.assign(apiSearchForm, {
    name: '',
    status: '',
  })
  await loadApiResources()
}

function findResourceNodeById(nodes: ResourceTreeNode[], id: number): ResourceTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const matched = node.children?.length ? findResourceNodeById(node.children, id) : null
    if (matched) {
      return matched
    }
  }
  return null
}

function findGroupNodeById(nodes: SysResGroupTreeNode[], id: number): SysResGroupTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const matched = node.children?.length ? findGroupNodeById(node.children, id) : null
    if (matched) {
      return matched
    }
  }
  return null
}

function isSameOrDescendantResource(node: ResourceTreeNode, id: number): boolean {
  if (node.id === id) {
    return true
  }
  return node.children?.some((child) => isSameOrDescendantResource(child, id)) || false
}

function isSameOrDescendantGroup(node: SysResGroupTreeNode, id: number): boolean {
  if (node.id === id) {
    return true
  }
  return node.children?.some((child) => isSameOrDescendantGroup(child, id)) || false
}

function createParentOption(
  node: ResourceTreeNode,
  editingNode: ResourceTreeNode | null,
): TreeSelectOption {
  return {
    id: node.id,
    name: formatResourceOptionName(node.name, node.status),
    disabled: isDisabledStatus(node.status) || Boolean(editingNode && isSameOrDescendantResource(editingNode, node.id)),
    children: node.children?.map((child) => createParentOption(child, editingNode)) || [],
  }
}

function createGroupOption(
  node: SysResGroupTreeNode,
  editingNode: SysResGroupTreeNode | null,
): TreeSelectOption {
  return {
    id: node.id,
    name: node.name,
    disabled: Boolean(editingNode && isSameOrDescendantGroup(editingNode, node.id)),
    children: node.children?.map((child) => createGroupOption(child, editingNode)) || [],
  }
}

function formatResourceOptionName(name: string, status?: string) {
  return formatDisabledName(name, status)
}

function resolveLockedDisabledParentId(parentId?: number) {
  if (!parentId) {
    return null
  }

  const parent = findResourceNodeById(viewResourceTree.value, parentId)
  return isDisabledStatus(parent?.status) ? parentId : null
}

function handleAddViewResource() {
  if (!canCreateResource.value) {
    warnNoPermission()
    return
  }
  resourceDialogTitle.value = '新增视图资源'
  resourceDialogMode.value = 'view'
  resetResourceForm()
  resourceForm.type = RESOURCE_TYPE.MENU
  resourceForm.parentId = 0
  resourceDialogVisible.value = true
}

function handleAddApiResource(group?: ResourceTreeNode) {
  if (!canCreateResource.value) {
    warnNoPermission()
    return
  }
  resourceDialogTitle.value = '新增接口资源'
  resourceDialogMode.value = 'api'
  resetResourceForm()
  resourceForm.type = RESOURCE_TYPE.API
  resourceForm.parentId = 0
  resourceForm.groupId = isApiGroupRow(group as ResourceTreeNode) ? Number(group?.id || 0) : 0
  resourceDialogVisible.value = true
}

async function handleEditResource(row: ResourceTreeNode, mode: ResourceTab) {
  if (!canUpdateResource.value) {
    warnNoPermission()
    return
  }
  resourceDialogTitle.value = mode === 'api' ? '编辑接口资源' : '编辑视图资源'
  resourceDialogMode.value = mode
  const response = await getResourceDetail(row.resId || row.id)
  initializingResourceForm.value = true
  Object.assign(resourceForm, {
    id: response.data.id,
    parentId: Number(response.data.parentId ?? 0),
    groupId: Number(response.data.groupId ?? 0),
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
  lockedDisabledParentId.value = resolveLockedDisabledParentId(resourceForm.parentId)
  initializingResourceForm.value = false
  resourceDialogVisible.value = true
}

function handleAddApiGroup(parent?: ResourceTreeNode) {
  if (!canCreateResourceGroup.value) {
    warnNoPermission()
    return
  }
  groupDialogTitle.value = '新增接口分组'
  resetGroupForm()
  groupForm.parentId = isApiGroupRow(parent as ResourceTreeNode) ? Number(parent?.id || 0) : 0
  groupDialogVisible.value = true
}

function handleEditApiGroup(row: ResourceTreeNode) {
  if (!canUpdateResourceGroup.value) {
    warnNoPermission()
    return
  }
  groupDialogTitle.value = '编辑接口分组'
  Object.assign(groupForm, {
    id: row.id,
    parentId: Number(row.parentId ?? 0),
    name: row.name,
    sort: row.sort || 1,
    remark: row.remark || '',
  })
  groupDialogVisible.value = true
}

function showDeleteError(error: unknown) {
  const message = getErrorMessage(error)
  if (message.includes('子资源') || message.includes('子节点')) {
    ElMessage.warning('该资源存在子资源，请先删除或迁移子资源后再删除')
    return
  }
  if (message.includes('子分组')) {
    ElMessage.warning('该分组存在子分组，请先删除或迁移子分组后再删除')
    return
  }
  if (message.includes('角色授权关联')) {
    ElMessage.warning('该资源已绑定角色权限，请先解除角色关联后再删除')
    return
  }
  if (message.includes('挂载关联')) {
    ElMessage.warning('该资源存在接口挂载关系，请先解除挂载后再删除')
    return
  }
  if (message.includes('接口资源')) {
    ElMessage.warning('该分组下存在接口资源，请先删除或迁移接口资源后再删除')
    return
  }
  ElMessage.error(message || '删除失败')
}

function showSubmitError(error: unknown, fallbackMessage: string) {
  const message = getErrorMessage(error)
  if (!message) {
    return
  }
  ElMessage.error(message || fallbackMessage)
}

async function handleDeleteResource(row: ResourceTreeNode) {
  if (!canDeleteResource.value) {
    warnNoPermission()
    return
  }
  const name = row.name || '该资源'
  try {
    await ElMessageBox.confirm(`确定要删除「${name}」吗？删除前请确认它没有子资源、角色授权或接口挂载关系。`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteResources([row.resId || row.id], { suppressErrorMessage: true })
    ElMessage.success('删除成功')
    await refreshAfterResourceChanged()
    await refreshAuthContextSilently()
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    showDeleteError(error)
  }
}

async function handleDeleteApiGroup(row: ResourceTreeNode) {
  if (!canDeleteResourceGroup.value) {
    warnNoPermission()
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除接口分组「${row.name}」吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteResourceGroups([row.id], { suppressErrorMessage: true })
    ElMessage.success('删除成功')
    await Promise.all([loadApiGroups(), loadApiResources()])
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    showDeleteError(error)
  }
}

async function handleResourceStatusChange(row: ResourceTreeNode) {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  if (!canUpdateResource.value) {
    row.status = previousStatus
    warnNoPermission()
    return
  }
  try {
    if (nextStatus === '2') {
      await ElMessageBox.confirm(
        '确定要禁用该资源吗？禁用后对应菜单、按钮、接口权限将失效。',
        '确认禁用',
        {
          confirmButtonText: '确定禁用',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    }
    await updateResource({
      id: row.resId || row.id,
      status: nextStatus,
    }, { suppressErrorMessage: true })
    ElMessage.success(`资源${nextStatus === '1' ? '启用' : '禁用'}成功`)
    await refreshAfterResourceChanged()
    await refreshAuthContextSilently()
  } catch (error) {
    row.status = previousStatus
    if (isUserCancel(error)) {
      return
    }
    showSubmitError(error, '资源状态更新失败')
  }
}

async function handleSubmitResource() {
  if (resourceFormSubmitting.value) {
    return
  }
  if (!canSubmitResourceForm.value) {
    warnNoPermission()
    return
  }
  if (!resourceFormRef.value) return
  const fallbackMessage = resourceForm.id ? '编辑资源失败' : '新增资源失败'
  resourceFormSubmitting.value = true
  try {
    await resourceFormRef.value.validate()
    const routeResource = isMenuResourceType(resourceForm.type)
    const permissionResource = isActionResourceType(resourceForm.type)
    const apiResource = isApiResourceType(resourceForm.type)
    const payload = {
      id: resourceForm.id || undefined,
      parentId: apiResource ? 0 : (lockedDisabledParentId.value ?? resourceForm.parentId ?? 0),
      groupId: apiResource ? (resourceForm.groupId ?? 0) : 0,
      name: resourceForm.name,
      type: resourceForm.type,
      path: routeResource ? resourceForm.path : '',
      component: routeResource && !resourceForm.isLink ? resourceForm.component : '',
      icon: routeResource ? resourceForm.icon : '',
      permission: permissionResource ? resourceForm.permission : '',
      isLink: routeResource ? resourceForm.isLink : false,
      linkUrl: routeResource && resourceForm.isLink ? resourceForm.linkUrl : '',
      visible: routeResource ? resourceForm.visible : true,
      sort: resourceForm.sort,
      status: resourceForm.status,
      remark: resourceForm.remark,
    }

    if (resourceForm.id) {
      await updateResource(payload, { suppressErrorMessage: true })
      ElMessage.success('编辑资源成功')
    } else {
      await createResource(payload, { suppressErrorMessage: true })
      ElMessage.success('新增资源成功')
    }
    resourceDialogVisible.value = false
    await refreshAfterResourceChanged()
    await refreshAuthContextSilently()
  } catch (error) {
    showSubmitError(error, fallbackMessage)
  } finally {
    resourceFormSubmitting.value = false
  }
}

async function handleSubmitGroup() {
  if (groupFormSubmitting.value) {
    return
  }
  if (!canSubmitGroupForm.value) {
    warnNoPermission()
    return
  }
  if (!groupFormRef.value) return
  const fallbackMessage = groupForm.id ? '编辑接口分组失败' : '新增接口分组失败'
  groupFormSubmitting.value = true
  try {
    await groupFormRef.value.validate()
    const payload = {
      id: groupForm.id || undefined,
      parentId: groupForm.parentId ?? 0,
      name: groupForm.name,
      sort: groupForm.sort,
      remark: groupForm.remark,
    }
    if (groupForm.id) {
      await updateResourceGroup(payload, { suppressErrorMessage: true })
      ElMessage.success('编辑接口分组成功')
    } else {
      await createResourceGroup(payload, { suppressErrorMessage: true })
      ElMessage.success('新增接口分组成功')
    }
    groupDialogVisible.value = false
    await Promise.all([loadApiGroups(), loadApiResources()])
  } catch (error) {
    showSubmitError(error, fallbackMessage)
  } finally {
    groupFormSubmitting.value = false
  }
}

async function handleMountApis(row: ResourceTreeNode) {
  if (!canMountResource.value) {
    warnNoPermission()
    return
  }
  mountTargetResource.value = row
  mountDialogVisible.value = true
  mountLoading.value = true
  try {
    const [apiTreeResponse, mountedResponse] = await Promise.all([
      getApiResourceTree(),
      queryMountedApis(row.id),
    ])
    mountApiTree.value = apiTreeResponse.data || []
    mountedApiKeys.value = (mountedResponse.data || []).map((item) => `api:${item.apiResId}`)
    await nextTick()
    mountTreeRef.value?.setCheckedKeys(mountedApiKeys.value)
  } finally {
    mountLoading.value = false
  }
}

async function handleSubmitMount() {
  if (mountSubmitting.value || !mountTargetResource.value || !mountTreeRef.value) {
    return
  }
  if (!canSaveMountResource.value) {
    warnNoPermission()
    return
  }
  mountSubmitting.value = true
  try {
    const checkedNodes = mountTreeRef.value.getCheckedNodes(false, false) as ResourceTreeNode[]
    const apiIds = Array.from(new Set(
      checkedNodes
        .filter((node) => isApiResourceType(node.type))
        .map((node) => Number(node.resId ?? node.id))
        .filter((id) => Number.isFinite(id)),
    ))
    const items: SysResMountItem[] = apiIds.map((apiResId, index) => ({
      apiResId,
      sort: (index + 1) * 10,
    }))
    await saveMountedApis(mountTargetResource.value.id, items, { suppressErrorMessage: true })
    ElMessage.success('接口挂载保存成功')
    mountDialogVisible.value = false
    await refreshAfterResourceChanged()
    await refreshAuthContextSilently()
  } catch (error) {
    showSubmitError(error, '接口挂载保存失败')
  } finally {
    mountSubmitting.value = false
  }
}

async function refreshAfterResourceChanged() {
  if (activeTab.value === 'api') {
    await Promise.all([loadApiGroups(), loadApiResources()])
    return
  }
  await loadViewResources()
}

function resetResourceForm() {
  initializingResourceForm.value = true
  lockedDisabledParentId.value = null
  Object.assign(resourceForm, {
    id: 0,
    parentId: 0,
    groupId: 0,
    name: '',
    type: resourceDialogMode.value === 'api' ? RESOURCE_TYPE.API : RESOURCE_TYPE.MENU,
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
  initializingResourceForm.value = false
  resourceFormRef.value?.clearValidate()
}

function resetGroupForm() {
  Object.assign(groupForm, {
    id: 0,
    parentId: 0,
    name: '',
    sort: 1,
    remark: '',
  })
  groupFormRef.value?.clearValidate()
}

function normalizeResourceFormByType() {
  if (isMenuResourceType(resourceForm.type)) {
    resourceForm.permission = ''
    resourceForm.groupId = 0
    return
  }

  resourceForm.path = ''
  resourceForm.component = ''
  resourceForm.icon = ''
  resourceForm.isLink = false
  resourceForm.linkUrl = ''
  resourceForm.visible = true

  if (isApiResourceType(resourceForm.type)) {
    resourceForm.parentId = 0
    return
  }

  resourceForm.groupId = 0
  if (isGroupResourceType(resourceForm.type)) {
    resourceForm.permission = ''
  }
}

watch(
  () => resourceForm.parentId,
  (parentId) => {
    if (
      initializingResourceForm.value
      || !resourceDialogVisible.value
      || !resourceForm.id
      || lockedDisabledParentId.value === null
    ) {
      return
    }
    if (parentId === lockedDisabledParentId.value) {
      return
    }

    resourceForm.parentId = lockedDisabledParentId.value
    ElMessage.warning('当前上级资源已禁用，不能变更')
  },
)

watch(
  () => resourceForm.type,
  () => {
    if (!initializingResourceForm.value) {
      normalizeResourceFormByType()
    }
  },
  { flush: 'sync' },
)

watch(
  () => resourceForm.isLink,
  (isLink) => {
    if (initializingResourceForm.value) {
      return
    }
    if (isLink) {
      resourceForm.component = ''
      return
    }
    resourceForm.linkUrl = ''
  },
  { flush: 'sync' },
)

function handleResourceDialogClose() {
  resetResourceForm()
}

function handleGroupDialogClose() {
  resetGroupForm()
}

function handleMountDialogClose() {
  mountTargetResource.value = null
  mountApiTree.value = []
  mountedApiKeys.value = []
}

function isMountTreeNodeDisabled(data: ResourceTreeNode) {
  return isApiResourceType(data.type) && isDisabledStatus(data.status)
}

function formatMountTreeLabel(data: ResourceTreeNode) {
  const typeSuffix = data.typeName ? `（${data.typeName}）` : ''
  return formatDisabledName(`${data.name}${typeSuffix}`, data.status)
}

function getResourceTypeName(type: number | string) {
  const typeMap: Record<string, string> = {
    '1': '菜单',
    '2': '页面',
    '3': '按钮',
    '4': '接口',
    '5': '分组',
  }
  return typeMap[String(type)] || String(type)
}

function getResourceTypeTagType(type: number | string) {
  const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    '1': 'primary',
    '2': 'success',
    '3': 'warning',
    '4': 'info',
    '5': 'danger',
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

.resource-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.resource-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}

.resource-tabs :deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  overflow-x: hidden;
}

.mount-tip {
  margin-bottom: 12px;
  color: #606266;
  font-size: 13px;
}

.mount-tree-container {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}
</style>
