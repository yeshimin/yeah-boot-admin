<template>
  <div class="dept-manage-container">
    <div class="page-header">
      <h2>部门管理</h2>
      <el-button type="primary" @click="handleAddDept">
        <el-icon><Plus /></el-icon>新增部门
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="部门名称">
          <el-input v-model="searchForm.name" placeholder="请输入部门名称" clearable></el-input>
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
        :data="deptList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="name" label="部门名称" min-width="120"></el-table-column>
        <el-table-column prop="code" label="部门编码" min-width="120"></el-table-column>
        <el-table-column prop="parentName" label="上级部门" min-width="120"></el-table-column>
        <el-table-column prop="manager" label="负责人" min-width="100"></el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="120"></el-table-column>
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
            <el-button type="primary" size="small" @click="handleEditDept(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteDept(scope.row)">
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

    <!-- 新增/编辑部门弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="deptFormRef"
        :model="deptForm"
        :rules="deptRules"
        label-width="100px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="deptForm.name" placeholder="请输入部门名称"></el-input>
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="deptForm.code" placeholder="请输入部门编码"></el-input>
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-select v-model="deptForm.parentId" placeholder="请选择上级部门">
            <el-option label="顶级部门" :value="0"></el-option>
            <el-option
              v-for="dept in deptOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="manager">
          <el-input v-model="deptForm.manager" placeholder="请输入负责人"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="deptForm.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="deptForm.sort" :min="0" :max="999"></el-input-number>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="deptForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="deptForm.status" active-value="1" inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitDept">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
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

// 选中的部门列表
const selectedDepts = ref<any[]>([])

// 部门列表数据
const deptList = ref([
  {
    id: 1,
    name: '总公司',
    code: 'COMPANY',
    parentId: 0,
    parentName: '',
    manager: '张三',
    phone: '010-12345678',
    sort: 1,
    status: 1,
    remark: '总公司',
    createTime: '2024-01-01 12:00:00'
  },
  {
    id: 2,
    name: '技术部',
    code: 'TECH',
    parentId: 1,
    parentName: '总公司',
    manager: '李四',
    phone: '010-12345679',
    sort: 2,
    status: 1,
    remark: '技术研发部门',
    createTime: '2024-01-02 12:00:00'
  },
  {
    id: 3,
    name: '前端开发',
    code: 'FRONTEND',
    parentId: 2,
    parentName: '技术部',
    manager: '王五',
    phone: '010-12345680',
    sort: 3,
    status: 1,
    remark: '前端开发团队',
    createTime: '2024-01-03 12:00:00'
  },
  {
    id: 4,
    name: '后端开发',
    code: 'BACKEND',
    parentId: 2,
    parentName: '技术部',
    manager: '赵六',
    phone: '010-12345681',
    sort: 4,
    status: 1,
    remark: '后端开发团队',
    createTime: '2024-01-03 12:00:00'
  },
  {
    id: 5,
    name: '测试团队',
    code: 'TEST',
    parentId: 2,
    parentName: '技术部',
    manager: '孙七',
    phone: '010-12345682',
    sort: 5,
    status: 1,
    remark: '测试团队',
    createTime: '2024-01-03 12:00:00'
  },
  {
    id: 6,
    name: '市场部',
    code: 'MARKET',
    parentId: 1,
    parentName: '总公司',
    manager: '周八',
    phone: '010-12345683',
    sort: 6,
    status: 1,
    remark: '市场推广部门',
    createTime: '2024-01-02 12:00:00'
  },
  {
    id: 7,
    name: '销售部',
    code: 'SALES',
    parentId: 1,
    parentName: '总公司',
    manager: '吴九',
    phone: '010-12345684',
    sort: 7,
    status: 1,
    remark: '销售部门',
    createTime: '2024-01-02 12:00:00'
  },
  {
    id: 8,
    name: '人力资源部',
    code: 'HR',
    parentId: 1,
    parentName: '总公司',
    manager: '郑十',
    phone: '010-12345685',
    sort: 8,
    status: 1,
    remark: '人力资源管理部门',
    createTime: '2024-01-02 12:00:00'
  },
  {
    id: 9,
    name: '财务部',
    code: 'FINANCE',
    parentId: 1,
    parentName: '总公司',
    manager: '钱十一',
    phone: '010-12345686',
    sort: 9,
    status: 1,
    remark: '财务部门',
    createTime: '2024-01-02 12:00:00'
  },
  {
    id: 10,
    name: '运营部',
    code: 'OPERATION',
    parentId: 1,
    parentName: '总公司',
    manager: '孙十二',
    phone: '010-12345687',
    sort: 10,
    status: 1,
    remark: '运营部门',
    createTime: '2024-01-02 12:00:00'
  }
])

// 部门列表选项（用于选择上级部门）
const deptOptions = ref<any[]>([])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增部门')

// 部门表单引用
const deptFormRef = ref<FormInstance>()

// 部门表单数据
const deptForm = reactive({
  id: '',
  name: '',
  code: '',
  parentId: 0,
  manager: '',
  phone: '',
  sort: 0,
  status: 1,
  remark: ''
})

// 部门表单验证规则
const deptRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入部门编码', trigger: 'blur' },
    { min: 2, max: 20, message: '部门编码长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  manager: [
    { required: true, message: '请输入负责人', trigger: 'blur' },
    { min: 2, max: 20, message: '负责人长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$|^0\d{2,3}-\d{7,8}$/, message: '请输入正确的电话号码', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
})

// 页面加载时获取部门列表
onMounted(() => {
  getDeptList()
  // 初始化部门列表选项
  initDeptOptions()
})

// 获取部门列表
const getDeptList = () => {
  tableLoading.value = true
  // 模拟异步请求
  setTimeout(() => {
    pagination.total = deptList.value.length
    tableLoading.value = false
  }, 500)
}

// 初始化部门列表选项
const initDeptOptions = () => {
  // 过滤出顶级部门和一级部门
  const options = deptList.value.filter(dept => dept.parentId === 0)
  deptOptions.value = options
}

// 搜索部门
const handleSearch = () => {
  pagination.currentPage = 1
  getDeptList()
}

// 重置搜索表单
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    status: ''
  })
  pagination.currentPage = 1
  getDeptList()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getDeptList()
}

// 当前页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getDeptList()
}

// 选择部门变化
const handleSelectionChange = (selection: any[]) => {
  selectedDepts.value = selection
}

// 新增部门
const handleAddDept = () => {
  dialogTitle.value = '新增部门'
  resetDeptForm()
  dialogVisible.value = true
}

// 编辑部门
const handleEditDept = (row: any) => {
  dialogTitle.value = '编辑部门'
  Object.assign(deptForm, row)
  dialogVisible.value = true
}

// 删除部门
const handleDeleteDept = (row: any) => {
  ElMessageBox.confirm('确定要删除该部门吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    const index = deptList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      deptList.value.splice(index, 1)
      ElMessage.success('删除成功')
      getDeptList()
      // 重新初始化部门列表选项
      initDeptOptions()
    }
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = (row: any) => {
  ElMessage.success(`部门${row.status === 1 ? '启用' : '禁用'}成功`)
}

// 提交部门表单
const handleSubmitDept = async () => {
  if (!deptFormRef.value) return
  try {
    await deptFormRef.value.validate()
    // 模拟提交
    if (deptForm.id) {
      // 编辑部门
      const index = deptList.value.findIndex(item => item.id === deptForm.id)
      if (index > -1) {
        // 获取上级部门名称
        const parentDept = deptList.value.find(dept => dept.id === deptForm.parentId)
        deptForm.parentName = parentDept ? parentDept.name : ''
        deptList.value[index] = { ...deptForm }
        ElMessage.success('编辑部门成功')
      }
    } else {
      // 新增部门
      // 获取上级部门名称
      const parentDept = deptList.value.find(dept => dept.id === deptForm.parentId)
      const newDept = {
        ...deptForm,
        id: Date.now(),
        parentName: parentDept ? parentDept.name : '',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      deptList.value.unshift(newDept)
      ElMessage.success('新增部门成功')
    }
    dialogVisible.value = false
    getDeptList()
    // 重新初始化部门列表选项
    initDeptOptions()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置部门表单
const resetDeptForm = () => {
  Object.assign(deptForm, {
    id: '',
    name: '',
    code: '',
    parentId: 0,
    manager: '',
    phone: '',
    sort: 0,
    status: 1,
    remark: ''
  })
  if (deptFormRef.value) {
    deptFormRef.value.resetFields()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetDeptForm()
}
</script>

<style scoped>
.dept-manage-container {
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
