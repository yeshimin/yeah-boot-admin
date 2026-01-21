<template>
  <div class="user-manage-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="handleAddUser">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable></el-input>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable></el-input>
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
        :data="userList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120"></el-table-column>
        <el-table-column prop="name" label="姓名" min-width="100"></el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="150"></el-table-column>
        <el-table-column prop="phone" label="电话" min-width="120"></el-table-column>
        <el-table-column prop="dept" label="部门" min-width="120"></el-table-column>
        <el-table-column prop="role" label="角色" min-width="100"></el-table-column>
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
            <el-button type="primary" size="small" @click="handleEditUser(scope.row)">
              编辑
            </el-button>
            <el-button type="success" size="small" @click="handleResetPassword(scope.row)">
              重置密码
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteUser(scope.row)">
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

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!userForm.id">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入电话"></el-input>
        </el-form-item>
        <el-form-item label="部门" prop="dept">
          <el-select v-model="userForm.dept" placeholder="请选择部门">
            <el-option label="技术部" value="技术部"></el-option>
            <el-option label="市场部" value="市场部"></el-option>
            <el-option label="销售部" value="销售部"></el-option>
            <el-option label="人力资源部" value="人力资源部"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="管理员"></el-option>
            <el-option label="编辑" value="编辑"></el-option>
            <el-option label="访客" value="访客"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="userForm.status" active-value="1" inactive-value="0"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表格加载状态
const tableLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  username: '',
  name: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 选中的用户列表
const selectedUsers = ref<any[]>([])

// 用户列表数据
const userList = ref([
  {
    id: 1,
    username: 'admin',
    name: '管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    dept: '技术部',
    role: '管理员',
    status: 1,
    createTime: '2024-01-01 12:00:00'
  },
  {
    id: 2,
    username: 'editor',
    name: '编辑',
    email: 'editor@example.com',
    phone: '13800138001',
    dept: '技术部',
    role: '编辑',
    status: 1,
    createTime: '2024-01-02 12:00:00'
  },
  {
    id: 3,
    username: 'visitor',
    name: '访客',
    email: 'visitor@example.com',
    phone: '13800138002',
    dept: '市场部',
    role: '访客',
    status: 0,
    createTime: '2024-01-03 12:00:00'
  }
])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')

// 用户表单引用
const userFormRef = ref<FormInstance>()

// 用户表单数据
const userForm = reactive({
  id: 0,
  username: '',
  name: '',
  password: '',
  email: '',
  phone: '',
  dept: '',
  role: '',
  status: 1,
  createTime: ''
})

// 用户表单验证规则
const userRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  dept: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
})

// 页面加载时获取用户列表
onMounted(() => {
  getUserList()
})

// 获取用户列表
const getUserList = () => {
  tableLoading.value = true
  // 模拟异步请求
  setTimeout(() => {
    pagination.total = userList.value.length
    tableLoading.value = false
  }, 500)
}

// 搜索用户
const handleSearch = () => {
  pagination.currentPage = 1
  getUserList()
}

// 重置搜索表单
const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    name: '',
    status: ''
  })
  pagination.currentPage = 1
  getUserList()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getUserList()
}

// 当前页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getUserList()
}

// 选择用户变化
const handleSelectionChange = (selection: any[]) => {
  selectedUsers.value = selection
}

// 新增用户
const handleAddUser = () => {
  dialogTitle.value = '新增用户'
  resetUserForm()
  dialogVisible.value = true
}

// 编辑用户
const handleEditUser = (row: any) => {
  dialogTitle.value = '编辑用户'
  Object.assign(userForm, row)
  dialogVisible.value = true
}

// 删除用户
const handleDeleteUser = (row: any) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    const index = userList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      userList.value.splice(index, 1)
      ElMessage.success('删除成功')
      getUserList()
    }
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = (row: any) => {
  ElMessage.success(`用户${row.status === 1 ? '启用' : '禁用'}成功`)
}

// 重置密码
const handleResetPassword = (row: any) => {
  ElMessageBox.confirm('确定要重置该用户的密码吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('密码重置成功，新密码为：123456')
  }).catch(() => {
    // 取消重置
  })
}

// 提交用户表单
const handleSubmitUser = async () => {
  if (!userFormRef.value) return
  try {
    await userFormRef.value.validate()
    // 模拟提交
    if (userForm.id) {
      // 编辑用户
      const index = userList.value.findIndex(item => item.id === userForm.id)
      if (index > -1) {
        userList.value[index] = { ...userForm }
        ElMessage.success('编辑用户成功')
      }
    } else {
      // 新增用户
      const newUser = {
        ...userForm,
        id: Date.now(),
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      userList.value.unshift(newUser)
      ElMessage.success('新增用户成功')
    }
    dialogVisible.value = false
    getUserList()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置用户表单
const resetUserForm = () => {
  Object.assign(userForm, {
    id: 0,
    username: '',
    name: '',
    password: '',
    email: '',
    phone: '',
    dept: '',
    role: '',
    status: 1,
    createTime: ''
  })
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetUserForm()
}
</script>

<style scoped>
.user-manage-container {
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
