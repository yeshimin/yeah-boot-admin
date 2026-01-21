<template>
  <div class="resource-manage-container">
    <div class="page-header">
      <h2>资源管理</h2>
      <el-button type="primary" @click="handleAddResource">
        <el-icon><Plus /></el-icon>新增资源
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="资源名称">
          <el-input v-model="searchForm.name" placeholder="请输入资源名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="searchForm.type" placeholder="请选择资源类型" clearable>
            <el-option label="菜单" value="menu"></el-option>
            <el-option label="按钮" value="button"></el-option>
            <el-option label="API" value="api"></el-option>
          </el-select>
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
        :data="resourceList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
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
              inactive-value="0"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEditResource(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteResource(scope.row)">
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

    <!-- 新增/编辑资源弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="resourceFormRef"
        :model="resourceForm"
        :rules="resourceRules"
        label-width="100px"
      >
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="resourceForm.name" placeholder="请输入资源名称"></el-input>
        </el-form-item>
        <el-form-item label="资源类型" prop="type">
          <el-select v-model="resourceForm.type" placeholder="请选择资源类型">
            <el-option label="菜单" value="menu"></el-option>
            <el-option label="按钮" value="button"></el-option>
            <el-option label="API" value="api"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="resourceForm.path" placeholder="请输入路径"></el-input>
        </el-form-item>
        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="resourceForm.permission" placeholder="请输入权限标识"></el-input>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="resourceForm.sort" :min="0" :max="999"></el-input-number>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="resourceForm.status" active-value="1" inactive-value="0"></el-switch>
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
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

// 表格加载状态
const tableLoading = ref(false)

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  status: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 选中的资源列表
const selectedResources = ref<any[]>([])

// 资源列表数据
const resourceList = ref([
  {
    id: 1,
    name: '系统管理',
    type: 'menu',
    path: '/system',
    permission: 'system:manage',
    sort: 1,
    status: 1
  },
  {
    id: 2,
    name: '用户管理',
    type: 'menu',
    path: '/system/user',
    permission: 'system:user:manage',
    sort: 2,
    status: 1
  },
  {
    id: 3,
    name: '角色管理',
    type: 'menu',
    path: '/system/role',
    permission: 'system:role:manage',
    sort: 3,
    status: 1
  },
  {
    id: 4,
    name: '资源管理',
    type: 'menu',
    path: '/system/resource',
    permission: 'system:resource:manage',
    sort: 4,
    status: 1
  },
  {
    id: 5,
    name: '组织架构',
    type: 'menu',
    path: '/system/org',
    permission: 'system:org:manage',
    sort: 5,
    status: 1
  },
  {
    id: 6,
    name: '岗位管理',
    type: 'menu',
    path: '/system/position',
    permission: 'system:position:manage',
    sort: 6,
    status: 1
  },
  {
    id: 7,
    name: '部门管理',
    type: 'menu',
    path: '/system/dept',
    permission: 'system:dept:manage',
    sort: 7,
    status: 1
  },
  {
    id: 8,
    name: '新增用户',
    type: 'button',
    path: '',
    permission: 'system:user:add',
    sort: 1,
    status: 1
  },
  {
    id: 9,
    name: '编辑用户',
    type: 'button',
    path: '',
    permission: 'system:user:edit',
    sort: 2,
    status: 1
  },
  {
    id: 10,
    name: '删除用户',
    type: 'button',
    path: '',
    permission: 'system:user:delete',
    sort: 3,
    status: 1
  }
])

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增资源')

// 资源表单引用
const resourceFormRef = ref<FormInstance>()

// 资源表单数据
const resourceForm = reactive({
  id: '',
  name: '',
  type: 'menu',
  path: '',
  permission: '',
  sort: 0,
  status: 1
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
  path: [
    { required: true, message: '请输入路径', trigger: 'blur' },
    { max: 200, message: '路径不能超过 200 个字符', trigger: 'blur' }
  ],
  permission: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { max: 100, message: '权限标识不能超过 100 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
})

// 页面加载时获取资源列表
onMounted(() => {
  getResourceList()
})

// 获取资源列表
const getResourceList = () => {
  tableLoading.value = true
  // 模拟异步请求
  setTimeout(() => {
    pagination.total = resourceList.value.length
    tableLoading.value = false
  }, 500)
}

// 搜索资源
const handleSearch = () => {
  pagination.currentPage = 1
  getResourceList()
}

// 重置搜索表单
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    type: '',
    status: ''
  })
  pagination.currentPage = 1
  getResourceList()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getResourceList()
}

// 当前页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getResourceList()
}

// 选择资源变化
const handleSelectionChange = (selection: any[]) => {
  selectedResources.value = selection
}

// 新增资源
const handleAddResource = () => {
  dialogTitle.value = '新增资源'
  resetResourceForm()
  dialogVisible.value = true
}

// 编辑资源
const handleEditResource = (row: any) => {
  dialogTitle.value = '编辑资源'
  Object.assign(resourceForm, row)
  dialogVisible.value = true
}

// 删除资源
const handleDeleteResource = (row: any) => {
  ElMessageBox.confirm('确定要删除该资源吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    const index = resourceList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      resourceList.value.splice(index, 1)
      ElMessage.success('删除成功')
      getResourceList()
    }
  }).catch(() => {
    // 取消删除
  })
}

// 状态变化
const handleStatusChange = (row: any) => {
  ElMessage.success(`资源${row.status === 1 ? '启用' : '禁用'}成功`)
}

// 提交资源表单
const handleSubmitResource = async () => {
  if (!resourceFormRef.value) return
  try {
    await resourceFormRef.value.validate()
    // 模拟提交
    if (resourceForm.id) {
      // 编辑资源
      const index = resourceList.value.findIndex(item => item.id === resourceForm.id)
      if (index > -1) {
        resourceList.value[index] = { ...resourceForm }
        ElMessage.success('编辑资源成功')
      }
    } else {
      // 新增资源
      const newResource = {
        ...resourceForm,
        id: Date.now()
      }
      resourceList.value.unshift(newResource)
      ElMessage.success('新增资源成功')
    }
    dialogVisible.value = false
    getResourceList()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置资源表单
const resetResourceForm = () => {
  Object.assign(resourceForm, {
    id: '',
    name: '',
    type: 'menu',
    path: '',
    permission: '',
    sort: 0,
    status: 1
  })
  if (resourceFormRef.value) {
    resourceFormRef.value.resetFields()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetResourceForm()
}

// 获取资源类型名称
const getResourceTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    api: 'API'
  }
  return typeMap[type] || type
}

// 获取资源类型标签类型
const getResourceTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    menu: 'primary',
    button: 'success',
    api: 'warning'
  }
  return typeMap[type] || 'info'
}
</script>

<style scoped>
.resource-manage-container {
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
