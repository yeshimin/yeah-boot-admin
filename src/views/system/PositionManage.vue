<template>
  <div class="position-manage-container">
    <div class="page-header">
      <h2>岗位管理</h2>
      <el-button type="primary" @click="handleAddPosition">
        <el-icon><Plus /></el-icon>新增岗位
      </el-button>
    </div>

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

    <div class="table-container">
      <el-table
        v-loading="tableLoading"
        :data="positionList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="岗位名称" min-width="120"></el-table-column>
        <el-table-column prop="code" label="岗位编码" min-width="120"></el-table-column>
        <el-table-column prop="sort" label="排序" min-width="80"></el-table-column>
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
            <el-button type="primary" size="small" @click="handleEditPosition(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeletePosition(scope.row)">
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
      @close="handleDialogClose"
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
          <el-button type="primary" @click="handleSubmitPosition">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createPost, deletePosts, getPostDetail, queryPosts, updatePost } from '@/api/upms'
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
  dialogTitle.value = '新增岗位'
  resetPositionForm()
  dialogVisible.value = true
}

// 编辑岗位
const handleEditPosition = async (row: any) => {
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

// 删除岗位
const handleDeletePosition = async (row: any) => {
  ElMessageBox.confirm('确定要删除该岗位吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deletePosts([row.id])
    ElMessage.success('删除成功')
    await getPositionList()
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = async (row: any) => {
  const nextStatus = row.status
  const previousStatus = nextStatus === '1' ? '2' : '1'
  try {
    await updatePost({
      id: row.id,
      status: nextStatus,
    })
    ElMessage.success(`岗位${nextStatus === '1' ? '启用' : '禁用'}成功`)
  } catch {
    row.status = previousStatus
  }
}

// 提交岗位表单
const handleSubmitPosition = async () => {
  if (!positionFormRef.value) return
  try {
    await positionFormRef.value.validate()
    const payload = {
      id: positionForm.id || undefined,
      name: positionForm.name,
      code: positionForm.code,
      sort: positionForm.sort,
      status: positionForm.status,
      remark: positionForm.remark || undefined,
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
</style>
