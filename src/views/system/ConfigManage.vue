<template>
  <div class="config-manage-container">
    <el-alert
      class="config-tip"
      type="info"
      :closable="false"
      title="参数禁用或缺失时，程序会使用代码中的默认值；修改数据库后可点击“刷新缓存”立即生效。"
    />

    <div class="search-bar">
      <el-form
        :inline="true"
        :model="searchForm"
        class="search-form"
        @keydown.enter.capture.prevent.stop="handleSearch"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="参数分组">
          <el-input v-model="searchForm.groupCode" placeholder="请输入参数分组" clearable />
        </el-form-item>
        <el-form-item label="参数名称">
          <el-input v-model="searchForm.configName" placeholder="请输入参数名称" clearable />
        </el-form-item>
        <el-form-item label="参数键">
          <el-input v-model="searchForm.configKey" placeholder="请输入参数键" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-bar">
      <div class="action-buttons">
        <el-button v-if="canCreateConfig" type="primary" @click="handleAddConfig">
          <el-icon><Plus /></el-icon>新增参数
        </el-button>
        <el-button
          v-if="canDeleteConfig"
          type="danger"
          :disabled="!hasSelectedConfigs"
          @click="handleBatchDeleteConfigs"
        >
          批量删除
        </el-button>
        <el-button
          v-if="canRefreshConfigCache"
          :loading="cacheRefreshing"
          @click="handleRefreshCache"
        >
          <el-icon><Refresh /></el-icon>刷新缓存
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        ref="configTableRef"
        v-loading="tableLoading"
        :data="configList"
        stripe
        height="100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="canDeleteConfig" type="selection" width="55" />
        <el-table-column prop="groupCode" label="参数分组" min-width="120" />
        <el-table-column prop="configName" label="参数名称" min-width="150" />
        <el-table-column prop="configKey" label="参数键" min-width="280" show-overflow-tooltip />
        <el-table-column prop="configValue" label="参数值" min-width="180" show-overflow-tooltip />
        <el-table-column prop="valueType" label="值类型" min-width="90">
          <template #default="scope">
            {{ getValueTypeLabel(scope.row.valueType) }}
          </template>
        </el-table-column>
        <el-table-column prop="publicAccess" label="公开访问" min-width="90">
          <template #default="scope">
            <el-switch
              v-model="scope.row.publicAccess"
              :disabled="!canUpdateConfig"
              @change="handlePublicAccessChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" min-width="80" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="1"
              inactive-value="2"
              :disabled="!canUpdateConfig"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="160" />
        <el-table-column v-if="hasConfigRowActions" label="操作" width="150" fixed="right">
          <template #default="scope">
            <div class="table-row-actions">
              <el-button
                v-if="canUpdateConfig"
                link
                type="primary"
                @click="handleEditConfig(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="canDeleteConfig"
                link
                type="danger"
                @click="handleDeleteConfig(scope.row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="620px"
      :close-on-click-modal="!formSubmitting"
      :close-on-press-escape="!formSubmitting"
      :show-close="!formSubmitting"
      @closed="handleDialogClosed"
    >
      <el-form ref="configFormRef" :model="configForm" :rules="configRules" label-width="100px">
        <el-form-item label="参数分组" prop="groupCode">
          <el-input v-model="configForm.groupCode" maxlength="32" placeholder="例如 auth、sms、excel" />
        </el-form-item>
        <el-form-item label="参数键" prop="configKey">
          <el-input
            v-model="configForm.configKey"
            :disabled="Boolean(configForm.id)"
            maxlength="128"
            placeholder="请输入全局唯一参数键"
          />
        </el-form-item>
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="configForm.configName" maxlength="64" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="值类型" prop="valueType">
          <el-select v-model="configForm.valueType" placeholder="请选择值类型" @change="handleValueTypeChange">
            <el-option v-for="item in valueTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数值" prop="configValue">
          <el-select v-if="configForm.valueType === CONFIG_VALUE_TYPE.BOOLEAN" v-model="configForm.configValue">
            <el-option label="true" value="true" />
            <el-option label="false" value="false" />
          </el-select>
          <el-input v-else v-model="configForm.configValue" maxlength="1024" placeholder="请输入参数值" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="configForm.sort" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="configForm.status" active-value="1" inactive-value="2" />
        </el-form-item>
        <el-form-item label="公开访问" prop="publicAccess">
          <el-switch v-model="configForm.publicAccess" />
          <span class="public-access-tip">仅启用且公开的参数可由匿名接口返回。</span>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="configForm.remark"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="请输入参数用途、取值范围等说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="formSubmitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSubmitting" @click="handleSubmitConfig">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import {
  createSysConfig,
  deleteSysConfigs,
  getSysConfigDetail,
  querySysConfigs,
  refreshSysConfigCache,
  updateSysConfig,
} from '@/api/upms'
import { useAuthStore } from '@/stores/auth'
import type { SysConfigEntity } from '@/types/upms'
import { getRequestErrorMessage, isUserCancel } from '@/utils/error'
import { buildConditions } from '@/utils/query'

const CONFIG_VALUE_TYPE = {
  STRING: 1,
  INTEGER: 2,
  LONG: 3,
  BOOLEAN: 4,
} as const

const valueTypeOptions = [
  { value: CONFIG_VALUE_TYPE.STRING, label: '字符串' },
  { value: CONFIG_VALUE_TYPE.INTEGER, label: '整数' },
  { value: CONFIG_VALUE_TYPE.LONG, label: '长整数' },
  { value: CONFIG_VALUE_TYPE.BOOLEAN, label: '布尔值' },
]
const numericValueTypes: number[] = [CONFIG_VALUE_TYPE.INTEGER, CONFIG_VALUE_TYPE.LONG]

const authStore = useAuthStore()
const canCreateConfig = computed(() => authStore.hasPermission('view:admin:sysConfig:create'))
const canUpdateConfig = computed(() => authStore.hasPermission('view:admin:sysConfig:update'))
const canDeleteConfig = computed(() => authStore.hasPermission('view:admin:sysConfig:delete'))
const canRefreshConfigCache = computed(() => authStore.hasPermission('view:admin:sysConfig:refreshCache'))
const hasConfigRowActions = computed(() => canUpdateConfig.value || canDeleteConfig.value)

const tableLoading = ref(false)
const cacheRefreshing = ref(false)
const configTableRef = ref<TableInstance>()
const configList = ref<SysConfigEntity[]>([])
const selectedConfigs = ref<SysConfigEntity[]>([])

const searchForm = reactive({
  groupCode: '',
  configName: '',
  configKey: '',
  status: '',
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增参数')
const formSubmitting = ref(false)
const configFormRef = ref<FormInstance>()
const configForm = reactive({
  id: 0,
  groupCode: '',
  configKey: '',
  configName: '',
  configValue: '',
  valueType: CONFIG_VALUE_TYPE.STRING as number,
  status: '1',
  publicAccess: false,
  sort: 1,
  remark: '',
})

const configRules = reactive<FormRules>({
  groupCode: [{ required: true, message: '请输入参数分组', trigger: 'blur' }],
  configKey: [
    { required: true, message: '请输入参数键', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9._:-]+$/,
      message: '参数键只能包含字母、数字、点、下划线、冒号和中划线',
      trigger: 'blur',
    },
  ],
  configName: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  valueType: [{ required: true, message: '请选择值类型', trigger: 'change' }],
  configValue: [
    {
      validator: (_rule, value: string, callback) => {
        if (value === undefined || value === null) {
          callback(new Error('请输入参数值'))
          return
        }
        if (numericValueTypes.includes(configForm.valueType) && !/^-?\d+$/.test(value)) {
          callback(new Error('请输入有效整数'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }],
})

const selectedConfigIds = computed(() => selectedConfigs.value.map((item) => item.id))
const hasSelectedConfigs = computed(() => selectedConfigIds.value.length > 0)

onMounted(() => {
  void getConfigList()
})

function getValueTypeLabel(valueType: number) {
  return valueTypeOptions.find((item) => item.value === valueType)?.label || String(valueType)
}

function clearSelection() {
  selectedConfigs.value = []
  configTableRef.value?.clearSelection()
}

async function getConfigList() {
  clearSelection()
  tableLoading.value = true
  try {
    const response = await querySysConfigs({
      current: pagination.currentPage,
      size: pagination.pageSize,
      conditions_: buildConditions([
        { field: 'groupCode', operator: 'like', value: searchForm.groupCode },
        { field: 'configName', operator: 'like', value: searchForm.configName },
        { field: 'configKey', operator: 'like', value: searchForm.configKey },
        { field: 'sort', operator: 'sort', value: 'asc' },
        { field: 'id', operator: 'sort', value: 'asc' },
      ]),
      status: searchForm.status || undefined,
    })
    configList.value = response.data.records
    pagination.total = response.data.total
  } finally {
    tableLoading.value = false
  }
}

async function handleSearch() {
  pagination.currentPage = 1
  await getConfigList()
}

async function handleReset() {
  Object.assign(searchForm, { groupCode: '', configName: '', configKey: '', status: '' })
  pagination.currentPage = 1
  await getConfigList()
}

async function handleSizeChange(size: number) {
  pagination.pageSize = size
  await getConfigList()
}

async function handleCurrentChange(page: number) {
  pagination.currentPage = page
  await getConfigList()
}

function handleSelectionChange(selection: SysConfigEntity[]) {
  selectedConfigs.value = selection
}

function handleAddConfig() {
  resetConfigForm()
  dialogTitle.value = '新增参数'
  dialogVisible.value = true
}

async function handleEditConfig(row: SysConfigEntity) {
  const response = await getSysConfigDetail(row.id)
  Object.assign(configForm, {
    id: response.data.id,
    groupCode: response.data.groupCode,
    configKey: response.data.configKey,
    configName: response.data.configName,
    configValue: response.data.configValue,
    valueType: response.data.valueType,
    status: response.data.status,
    publicAccess: Boolean(response.data.publicAccess),
    sort: response.data.sort,
    remark: response.data.remark || '',
  })
  dialogTitle.value = '编辑参数'
  dialogVisible.value = true
}

function handleValueTypeChange() {
  if (configForm.valueType === CONFIG_VALUE_TYPE.BOOLEAN && !['true', 'false'].includes(configForm.configValue)) {
    configForm.configValue = 'true'
  }
}

async function handleSubmitConfig() {
  if (!configFormRef.value || formSubmitting.value) {
    return
  }
  formSubmitting.value = true
  try {
    await configFormRef.value.validate()
    const payload = {
      groupCode: configForm.groupCode,
      configName: configForm.configName,
      configValue: configForm.configValue,
      valueType: configForm.valueType,
      status: configForm.status,
      publicAccess: configForm.publicAccess,
      sort: configForm.sort,
      remark: configForm.remark,
    }
    if (configForm.id) {
      await updateSysConfig({ ...payload, id: configForm.id }, { suppressErrorMessage: true })
      ElMessage.success('编辑参数成功')
    } else {
      await createSysConfig({ ...payload, configKey: configForm.configKey }, { suppressErrorMessage: true })
      ElMessage.success('新增参数成功')
    }
    dialogVisible.value = false
    await getConfigList()
  } catch (error) {
    const message = getRequestErrorMessage(error)
    if (message) {
      ElMessage.error(message)
    }
  } finally {
    formSubmitting.value = false
  }
}

async function handleStatusChange(row: SysConfigEntity) {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  try {
    await updateSysConfig(
      {
        id: row.id,
        groupCode: row.groupCode,
        configName: row.configName,
        configValue: row.configValue,
        valueType: row.valueType,
        status: row.status,
        publicAccess: row.publicAccess,
        sort: row.sort,
        remark: row.remark || '',
      },
      { suppressErrorMessage: true },
    )
    ElMessage.success(`参数${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch (error) {
    row.status = previousStatus
    ElMessage.error(getRequestErrorMessage(error) || '参数状态更新失败')
  }
}

async function handlePublicAccessChange(row: SysConfigEntity) {
  const nextPublicAccess = row.publicAccess
  try {
    await updateSysConfig(
      {
        id: row.id,
        groupCode: row.groupCode,
        configName: row.configName,
        configValue: row.configValue,
        valueType: row.valueType,
        status: row.status,
        publicAccess: row.publicAccess,
        sort: row.sort,
        remark: row.remark || '',
      },
      { suppressErrorMessage: true },
    )
    ElMessage.success(`参数已${nextPublicAccess ? '允许' : '禁止'}公开访问`)
  } catch (error) {
    row.publicAccess = !nextPublicAccess
    ElMessage.error(getRequestErrorMessage(error) || '公开访问状态更新失败')
  }
}

async function handleDeleteConfig(row: SysConfigEntity) {
  await deleteConfigRecords([row.id], '确定要删除该系统参数吗？')
}

async function handleBatchDeleteConfigs() {
  if (!hasSelectedConfigs.value) {
    ElMessage.warning('请先选择要删除的系统参数')
    return
  }
  await deleteConfigRecords(
    selectedConfigIds.value,
    `确定要删除选中的 ${selectedConfigIds.value.length} 个系统参数吗？`,
  )
}

async function deleteConfigRecords(ids: number[], message: string) {
  try {
    await ElMessageBox.confirm(message, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteSysConfigs(ids, { suppressErrorMessage: true })
    ElMessage.success('删除成功')
    await getConfigList()
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    ElMessage.error(getRequestErrorMessage(error) || '删除系统参数失败')
  }
}

async function handleRefreshCache() {
  if (cacheRefreshing.value) {
    return
  }
  cacheRefreshing.value = true
  try {
    await refreshSysConfigCache({ suppressErrorMessage: true })
    ElMessage.success('系统参数缓存刷新成功')
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error) || '系统参数缓存刷新失败')
  } finally {
    cacheRefreshing.value = false
  }
}

function resetConfigForm() {
  Object.assign(configForm, {
    id: 0,
    groupCode: '',
    configKey: '',
    configName: '',
    configValue: '',
    valueType: CONFIG_VALUE_TYPE.STRING,
    status: '1',
    publicAccess: false,
    sort: 1,
    remark: '',
  })
  configFormRef.value?.clearValidate()
}

function handleDialogClosed() {
  resetConfigForm()
}
</script>

<style scoped>
.config-manage-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.config-tip {
  margin-bottom: 16px;
}

.public-access-tip {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.table-container {
  flex: 1;
  min-height: 0;
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
