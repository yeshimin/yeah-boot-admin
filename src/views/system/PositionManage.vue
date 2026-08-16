<template>
  <div class="position-manage-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="岗位名称">
          <el-input v-model="searchForm.name" placeholder="请输入岗位名称" clearable></el-input>
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
          v-if="canCreatePosition"
          type="primary"
          @click="handleAddPosition"
        >
          <el-icon><Plus /></el-icon>新增岗位
        </el-button>
        <el-button
          v-if="canDeletePosition"
          type="danger"
          :disabled="!hasSelectedPositions"
          @click="handleBatchDeletePositions"
        >
          批量删除
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        ref="positionTableRef"
        v-loading="tableLoading"
        :data="positionList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="canDeletePosition" type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="岗位名称" min-width="120"></el-table-column>
        <el-table-column prop="code" label="岗位编码" min-width="120"></el-table-column>
        <el-table-column prop="sort" label="排序" min-width="80"></el-table-column>
        <el-table-column
          prop="remark"
          label="备注"
          min-width="180"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="1"
              inactive-value="2"
              :disabled="!canUpdatePosition"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160"></el-table-column>
        <el-table-column v-if="hasPositionRowActions" label="操作" min-width="180" fixed="right">
          <template #default="scope">
            <el-button
              v-if="canUpdatePosition"
              type="primary"
              size="small"
              @click="handleEditPosition(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDeletePosition"
              type="danger"
              size="small"
              @click="handleDeletePosition(scope.row)"
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

    <!-- 新增/编辑岗位弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @closed="handleDialogClose"
    >
      <el-form
        ref="positionFormRef"
        :model="positionForm"
        :rules="positionRules"
        label-width="100px"
      >
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="positionForm.name" placeholder="请输入岗位名称"></el-input>
        </el-form-item>
        <el-form-item label="岗位编码" prop="code">
          <el-input v-model="positionForm.code" placeholder="请输入岗位编码"></el-input>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="positionForm.sort" :min="1" :max="999"></el-input-number>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="positionForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="positionForm.status" active-value="1" inactive-value="2"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button v-if="canSubmitPositionForm" type="primary" @click="handleSubmitPosition">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { createPost, deletePosts, getPostDetail, queryPosts, updatePost } from '@/api/upms'
import { buildConditions } from '@/utils/query'

const authStore = useAuthStore()
const canCreatePosition = computed(() => authStore.hasPermission('admin:sysPost:create'))
const canUpdatePosition = computed(() => authStore.hasPermission('admin:sysPost:update'))
const canDeletePosition = computed(() => authStore.hasPermission('admin:sysPost:delete'))

// 表格加载状态
const tableLoading = ref(false)
const positionTableRef = ref<{ clearSelection: () => void }>()

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

// 选中的岗位列表
const selectedPositions = ref<any[]>([])

// 岗位列表数据
const positionList = ref<any[]>([])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增岗位')

// 岗位表单引用
const positionFormRef = ref<FormInstance>()

// 岗位表单数据
const positionForm = reactive({
  id: 0,
  name: '',
  code: '',
  sort: 1,
  status: '1',
  remark: '',
  createTime: ''
})
const canSubmitPositionForm = computed(() => (
  positionForm.id ? canUpdatePosition.value : canCreatePosition.value
))
const selectedPositionIds = computed(() => (
  selectedPositions.value
    .map((item) => Number(item.id))
    .filter((id) => Number.isFinite(id))
))
const hasSelectedPositions = computed(() => selectedPositionIds.value.length > 0)
const hasPositionRowActions = computed(() => canUpdatePosition.value || canDeletePosition.value)

function warnNoPermission() {
  ElMessage.warning('暂无操作权限')
}

const clearSelectedPositions = () => {
  selectedPositions.value = []
  positionTableRef.value?.clearSelection()
}

// 岗位表单验证规则
const positionRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' },
    { min: 2, max: 50, message: '岗位名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入岗位编码', trigger: 'blur' },
    { min: 2, max: 20, message: '岗位编码长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
})

// 页面加载时获取岗位列表
onMounted(() => {
  void getPositionList()
})

// 获取岗位列表
const getPositionList = async () => {
  clearSelectedPositions()
  tableLoading.value = true
  try {
    const response = await queryPosts({
      current: pagination.currentPage,
      size: pagination.pageSize,
      conditions_: buildConditions([
        { field: 'name', operator: 'like', value: searchForm.name },
      ]),
      status: searchForm.status || undefined,
    })

    positionList.value = response.data.records
    pagination.total = response.data.total
  } finally {
    tableLoading.value = false
  }
}

// 搜索岗位
const handleSearch = async () => {
  pagination.currentPage = 1
  await getPositionList()
}

// 重置搜索表单
const handleReset = async () => {
  Object.assign(searchForm, {
    name: '',
    status: ''
  })
  pagination.currentPage = 1
  await getPositionList()
}

// 分页大小变化
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  await getPositionList()
}

// 当前页码变化
const handleCurrentChange = async (page: number) => {
  pagination.currentPage = page
  await getPositionList()
}

// 选择岗位变化
const handleSelectionChange = (selection: any[]) => {
  selectedPositions.value = selection
}

// 新增岗位
const handleAddPosition = () => {
  if (!canCreatePosition.value) {
    warnNoPermission()
    return
  }
  dialogTitle.value = '新增岗位'
  resetPositionForm()
  dialogVisible.value = true
}

// 编辑岗位
const handleEditPosition = async (row: any) => {
  if (!canUpdatePosition.value) {
    warnNoPermission()
    return
  }
  dialogTitle.value = '编辑岗位'
  const response = await getPostDetail(row.id)
  Object.assign(positionForm, {
    id: response.data.id,
    name: response.data.name,
    code: response.data.code || '',
    sort: response.data.sort || 1,
    status: response.data.status || '1',
    remark: response.data.remark || '',
    createTime: response.data.createTime || '',
  })
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
  if (message.includes('关联')) {
    ElMessage.warning('该岗位已绑定用户，请先解除用户关联后再删除')
    return
  }
  ElMessage.error(message || '删除失败')
}

// 删除岗位
const handleDeletePosition = async (row: any) => {
  if (!canDeletePosition.value) {
    warnNoPermission()
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该岗位吗？删除前请确认该岗位未绑定用户。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deletePosts([row.id], { suppressErrorMessage: true })
    ElMessage.success('删除成功')
    await getPositionList()
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    showDeleteError(error)
  }
}

const handleBatchDeletePositions = async () => {
  if (!canDeletePosition.value) {
    warnNoPermission()
    return
  }

  const ids = selectedPositionIds.value
  if (ids.length === 0) {
    ElMessage.warning('请先选择要删除的岗位')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${ids.length} 个岗位吗？删除前请确认这些岗位未绑定用户。`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deletePosts(ids, { suppressErrorMessage: true })
    clearSelectedPositions()
    ElMessage.success('批量删除成功')
    await getPositionList()
  } catch (error) {
    if (isUserCancel(error)) {
      return
    }
    showDeleteError(error)
  }
}

// 状态变化
const handleStatusChange = async (row: any) => {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  if (!canUpdatePosition.value) {
    row.status = previousStatus
    warnNoPermission()
    return
  }
  try {
    if (nextStatus === '2') {
      await ElMessageBox.confirm(
        '确定要禁用该岗位吗？禁用后该岗位将不能作为新的用户岗位。',
        '确认禁用',
        {
          confirmButtonText: '确定禁用',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    }
    await updatePost({
      id: row.id,
      status: nextStatus,
    })
    ElMessage.success(`岗位${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch (error) {
    row.status = previousStatus
    if (isUserCancel(error)) {
      return
    }
  }
}

// 提交岗位表单
const handleSubmitPosition = async () => {
  if (!canSubmitPositionForm.value) {
    warnNoPermission()
    return
  }
  if (!positionFormRef.value) return
  try {
    await positionFormRef.value.validate()
    const payload = {
      id: positionForm.id || undefined,
      name: positionForm.name,
      code: positionForm.code,
      sort: positionForm.sort,
      status: positionForm.status,
      remark: positionForm.remark,
    }

    if (positionForm.id) {
      await updatePost(payload)
      ElMessage.success('编辑岗位成功')
    } else {
      await createPost(payload)
      ElMessage.success('新增岗位成功')
    }
    dialogVisible.value = false
    await getPositionList()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置岗位表单
const resetPositionForm = () => {
  Object.assign(positionForm, {
    id: 0,
    name: '',
    code: '',
    sort: 1,
    status: '1',
    remark: '',
    createTime: ''
  })
  if (positionFormRef.value) {
    positionFormRef.value.resetFields()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetPositionForm()
}
</script>

<style scoped>
.position-manage-container {
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
