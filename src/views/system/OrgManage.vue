<template>
  <div class="org-manage-container">
    <div class="page-header">
      <h2>组织架构</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddDept">
          <el-icon><Plus /></el-icon>新增部门
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>导出
        </el-button>
      </div>
    </div>

    <div class="org-content">
      <!-- 左侧部门树 -->
      <div class="org-tree-container">
        <div class="tree-header">
          <h3>部门结构</h3>
          <el-input
            v-model="treeSearchText"
            placeholder="搜索部门"
            clearable
            size="small"
            prefix-icon="Search"
          ></el-input>
        </div>
        <div class="tree-content">
          <el-tree
            ref="orgTreeRef"
            :data="deptTree"
            node-key="id"
            :props="deptTreeProps"
            default-expand-all
            @node-click="handleNodeClick"
            @node-contextmenu="handleNodeContextMenu"
          >
            <template #default="{ node, data }">
              <span class="tree-node-content">
                <el-icon>
                  <component :is="data.icon || OfficeBuilding" />
                </el-icon>
                <span>{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧部门详情和成员列表 -->
      <div class="org-detail-container" v-if="currentDept">
        <!-- 部门详情 -->
        <div class="detail-section">
          <div class="section-header">
            <h3>部门详情</h3>
            <div class="section-actions">
              <el-button type="primary" size="small" @click="handleEditDept(currentDept)">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteDept(currentDept)">
                删除
              </el-button>
            </div>
          </div>
          <div class="detail-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="部门名称">{{ currentDept.name }}</el-descriptions-item>
              <el-descriptions-item label="部门编码">{{ currentDept.code || '-' }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ currentDept.manager || '-' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ currentDept.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="部门人数">{{ currentDept.memberCount || 0 }}人</el-descriptions-item>
              <el-descriptions-item label="状态">{{ currentDept.status === 1 ? '启用' : '禁用' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间" :span="2">{{ currentDept.createTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ currentDept.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 部门成员列表 -->
        <div class="members-section">
          <div class="section-header">
            <h3>部门成员 ({{ currentDept.memberCount || 0 }})</h3>
            <el-button type="primary" size="small" @click="handleAddMember">
              <el-icon><Plus /></el-icon>添加成员
            </el-button>
          </div>
          <div class="members-content">
            <el-table
              :data="memberList"
              stripe
              style="width: 100%"
              @selection-change="handleMemberSelectionChange"
            >
              <el-table-column type="selection" width="55"></el-table-column>
              <el-table-column prop="name" label="姓名" min-width="100"></el-table-column>
              <el-table-column prop="username" label="用户名" min-width="120"></el-table-column>
              <el-table-column prop="position" label="岗位" min-width="100"></el-table-column>
              <el-table-column prop="email" label="邮箱" min-width="150"></el-table-column>
              <el-table-column prop="phone" label="电话" min-width="120"></el-table-column>
              <el-table-column label="操作" min-width="120" fixed="right">
                <template #default="scope">
                  <el-button type="primary" size="small">
                    编辑
                  </el-button>
                  <el-button type="danger" size="small">
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-container">
              <el-pagination
                v-model:current-page="memberPagination.currentPage"
                v-model:page-size="memberPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="memberPagination.total"
                @size-change="handleMemberSizeChange"
                @current-change="handleMemberCurrentChange"
              ></el-pagination>
            </div>
          </div>
        </div>
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
import { ref, reactive, onMounted, computed, markRaw } from 'vue'
import { Plus, Upload, Download, OfficeBuilding as RawOfficeBuilding } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 使用 markRaw 标记图标组件为非响应式
const OfficeBuilding = markRaw(RawOfficeBuilding)

// 部门树搜索文本
const treeSearchText = ref('')

// 部门树引用
const orgTreeRef = ref<any>()

// 部门树数据
const deptTree = ref([
  {
    id: 1,
    name: '总公司',
    code: 'COMPANY',
    manager: '张三',
    phone: '010-12345678',
    memberCount: 100,
    status: 1,
    createTime: '2024-01-01 12:00:00',
    remark: '总公司',
    children: [
      {
        id: 2,
        name: '技术部',
        code: 'TECH',
        manager: '李四',
        phone: '010-12345679',
        memberCount: 50,
        status: 1,
        createTime: '2024-01-02 12:00:00',
        remark: '技术研发部门',
        children: [
          {
            id: 3,
            name: '前端开发',
            code: 'FRONTEND',
            manager: '王五',
            phone: '010-12345680',
            memberCount: 20,
            status: 1,
            createTime: '2024-01-03 12:00:00',
            remark: '前端开发团队'
          },
          {
            id: 4,
            name: '后端开发',
            code: 'BACKEND',
            manager: '赵六',
            phone: '010-12345681',
            memberCount: 25,
            status: 1,
            createTime: '2024-01-03 12:00:00',
            remark: '后端开发团队'
          },
          {
            id: 5,
            name: '测试团队',
            code: 'TEST',
            manager: '孙七',
            phone: '010-12345682',
            memberCount: 5,
            status: 1,
            createTime: '2024-01-03 12:00:00',
            remark: '测试团队'
          }
        ]
      },
      {
        id: 6,
        name: '市场部',
        code: 'MARKET',
        manager: '周八',
        phone: '010-12345683',
        memberCount: 20,
        status: 1,
        createTime: '2024-01-02 12:00:00',
        remark: '市场推广部门'
      },
      {
        id: 7,
        name: '销售部',
        code: 'SALES',
        manager: '吴九',
        phone: '010-12345684',
        memberCount: 25,
        status: 1,
        createTime: '2024-01-02 12:00:00',
        remark: '销售部门'
      },
      {
        id: 8,
        name: '人力资源部',
        code: 'HR',
        manager: '郑十',
        phone: '010-12345685',
        memberCount: 5,
        status: 1,
        createTime: '2024-01-02 12:00:00',
        remark: '人力资源管理部门'
      }
    ]
  }
])

// 部门树配置
const deptTreeProps = {
  children: 'children',
  label: 'name'
}

// 当前选中的部门
const currentDept = ref<any>(null)

// 部门列表选项（用于选择上级部门）
const deptOptions = ref<any[]>([])

// 成员列表数据
const memberList = ref([
  {
    id: 1,
    name: '张三',
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    position: '总经理',
    deptId: 1
  },
  {
    id: 2,
    name: '李四',
    username: 'lisi',
    email: 'lisi@example.com',
    phone: '13800138001',
    position: '技术总监',
    deptId: 2
  },
  {
    id: 3,
    name: '王五',
    username: 'wangwu',
    email: 'wangwu@example.com',
    phone: '13800138002',
    position: '前端经理',
    deptId: 3
  },
  {
    id: 4,
    name: '赵六',
    username: 'zhaoliu',
    email: 'zhaoliu@example.com',
    phone: '13800138003',
    position: '后端经理',
    deptId: 4
  },
  {
    id: 5,
    name: '孙七',
    username: 'sunqi',
    email: 'sunqi@example.com',
    phone: '13800138004',
    position: '测试经理',
    deptId: 5
  }
])

// 成员分页配置
const memberPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

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
  ]
})

// 页面加载时初始化数据
onMounted(() => {
  // 初始化部门列表选项
  flattenDeptTree(deptTree.value)
  // 默认选中第一个部门
  if (deptTree.value.length > 0) {
    currentDept.value = deptTree.value[0]
    loadMemberList(currentDept.value.id)
  }
})

// 扁平化部门树，用于选择上级部门
const flattenDeptTree = (tree: any[], prefix = '', options: any[] = []) => {
  for (const node of tree) {
    options.push({
      id: node.id,
      name: `${prefix}${node.name}`,
      parentId: node.parentId
    })
    if (node.children && node.children.length > 0) {
      flattenDeptTree(node.children, `${prefix}└─ `, options)
    }
  }
  deptOptions.value = options
}

// 部门节点点击事件
const handleNodeClick = (data: any) => {
  currentDept.value = data
  loadMemberList(data.id)
}

// 加载成员列表
const loadMemberList = (deptId: number) => {
  // 模拟异步请求
  setTimeout(() => {
    // 过滤出该部门的成员
    const filteredMembers = memberList.value.filter(item => item.deptId === deptId)
    memberPagination.total = filteredMembers.length
  }, 300)
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
  if (!row) return

  ElMessageBox.confirm('确定要删除该部门吗？删除后该部门下的所有子部门也将被删除', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    ElMessage.success('删除部门成功')
    // 重置当前选中的部门
    if (deptTree.value.length > 0) {
      currentDept.value = deptTree.value[0]
      loadMemberList(currentDept.value.id)
    } else {
      currentDept.value = null
    }
  }).catch(() => {
    // 取消删除
  })
}

// 提交部门表单
const handleSubmitDept = async () => {
  if (!deptFormRef.value) return
  try {
    await deptFormRef.value.validate()
    // 模拟提交
    if (deptForm.id) {
      // 编辑部门
      ElMessage.success('编辑部门成功')
    } else {
      // 新增部门
      ElMessage.success('新增部门成功')
    }
    dialogVisible.value = false
    // 刷新部门树
    // refreshDeptTree()
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

// 成员分页大小变化
const handleMemberSizeChange = (size: number) => {
  memberPagination.pageSize = size
  loadMemberList(currentDept.value.id)
}

// 成员当前页码变化
const handleMemberCurrentChange = (page: number) => {
  memberPagination.currentPage = page
  loadMemberList(currentDept.value.id)
}

// 成员选择变化
const handleMemberSelectionChange = (selection: any[]) => {
  // 处理成员选择逻辑
}

// 添加成员
const handleAddMember = () => {
  ElMessage.info('添加成员功能待实现')
}

// 导入部门
const handleImport = () => {
  ElMessage.info('导入部门功能待实现')
}

// 导出部门
const handleExport = () => {
  ElMessage.info('导出部门功能待实现')
}

// 部门节点右键菜单
const handleNodeContextMenu = (event: Event, data: any) => {
  event.preventDefault()
  // 处理右键菜单逻辑
}
</script>

<style scoped>
.org-manage-container {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.org-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
}

.org-tree-container {
  width: 300px;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tree-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.tree-header h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.tree-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.org-detail-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.detail-section, .members-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.detail-content {
  padding: 16px 0;
}

.detail-empty, .members-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.members-content {
  padding: 16px 0;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
