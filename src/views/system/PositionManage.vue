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
            <el-option label="启用" :value="1"></el-option>
            <el-option label="禁用" :value="0"></el-option>
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
              inactive-value="0"
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
          <el-input-number v-model="positionForm.sort" :min="0" :max="999"></el-input-number>
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
          <el-switch v-model="positionForm.status" active-value="1" inactive-value="0"></el-switch>
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
const positionList = ref([
  {
    id: 1,
    name: '总经理',
    code: 'GM',
    sort: 1,
    status: 1,
    remark: '公司总经理',
    createTime: '2024-01-01 12:00:00'
  },
  {
    id: 2,
    name: '技术总监',
    code: 'CTO',
    sort: 2,
    status: 1,
    remark: '技术部门负责人',
    createTime: '2024-01-02 12:00:00'
  },
  {
    id: 3,
    name: '前端经理',
    code: 'FE_MANAGER',
    sort: 3,
    status: 1,
    remark: '前端开发团队负责人',
    createTime: '2024-01-03 12:00:00'
  },
  {
    id: 4,
    name: '后端经理',
    code: 'BE_MANAGER',
    sort: 4,
    status: 1,
    remark: '后端开发团队负责人',
    createTime: '2024-01-03 12:00:00'
  },
  {
    id: 5,
    name: '测试经理',
    code: 'TEST_MANAGER',
    sort: 5,
    status: 1,
    remark: '测试团队负责人',
    createTime: '2024-01-03 12:00:00'
  },
  {
    id: 6,
    name: '前端开发工程师',
    code: 'FE_DEVELOPER',
    sort: 6,
    status: 1,
    remark: '前端开发工程师',
    createTime: '2024-01-04 12:00:00'
  },
  {
    id: 7,
    name: '后端开发工程师',
    code: 'BE_DEVELOPER',
    sort: 7,
    status: 1,
    remark: '后端开发工程师',
    createTime: '2024-01-04 12:00:00'
  },
  {
    id: 8,
    name: '测试工程师',
    code: 'TEST_ENGINEER',
    sort: 8,
    status: 1,
    remark: '测试工程师',
    createTime: '2024-01-04 12:00:00'
  },
  {
    id: 9,
    name: 'UI设计师',
    code: 'UI_DESIGNER',
    sort: 9,
    status: 1,
    remark: 'UI设计师',
    createTime: '2024-01-05 12:00:00'
  },
  {
    id: 10,
    name: '产品经理',
    code: 'PRODUCT_MANAGER',
    sort: 10,
    status: 1,
    remark: '产品经理',
    createTime: '2024-01-05 12:00:00'
  }
])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增岗位')

// 岗位表单引用
const positionFormRef = ref<FormInstance>()

// 岗位表单数据
const positionForm = reactive({
  id: '',
  name: '',
  code: '',
  sort: 0,
  status: 1,
  remark: ''
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
  getPositionList()
})

// 获取岗位列表
const getPositionList = () => {
  tableLoading.value = true
  // 模拟异步请求
  setTimeout(() => {
    pagination.total = positionList.value.length
    tableLoading.value = false
  }, 500)
}

// 搜索岗位
const handleSearch = () => {
  pagination.currentPage = 1
  getPositionList()
}

// 重置搜索表单
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    status: ''
  })
  pagination.currentPage = 1
  getPositionList()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getPositionList()
}

// 当前页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getPositionList()
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
const handleEditPosition = (row: any) => {
  dialogTitle.value = '编辑岗位'
  Object.assign(positionForm, row)
  dialogVisible.value = true
}

// 删除岗位
const handleDeletePosition = (row: any) => {
  ElMessageBox.confirm('确定要删除该岗位吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    const index = positionList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      positionList.value.splice(index, 1)
      ElMessage.success('删除成功')
      getPositionList()
    }
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = (row: any) => {
  ElMessage.success(`岗位${row.status === 1 ? '启用' : '禁用'}成功`)
}

// 提交岗位表单
const handleSubmitPosition = async () => {
  if (!positionFormRef.value) return
  try {
    await positionFormRef.value.validate()
    // 模拟提交
    if (positionForm.id) {
      // 编辑岗位
      const index = positionList.value.findIndex(item => item.id === positionForm.id)
      if (index > -1) {
        positionList.value[index] = { ...positionForm }
        ElMessage.success('编辑岗位成功')
      }
    } else {
      // 新增岗位
      const newPosition = {
        ...positionForm,
        id: Date.now(),
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      positionList.value.unshift(newPosition)
      ElMessage.success('新增岗位成功')
    }
    dialogVisible.value = false
    getPositionList()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置岗位表单
const resetPositionForm = () => {
  Object.assign(positionForm, {
    id: '',
    name: '',
    code: '',
    sort: 0,
    status: 1,
    remark: ''
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
