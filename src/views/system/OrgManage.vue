<template>
  <div class="org-manage-container">
    <div class="page-header">
      <h2>组织管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddDept">
          <el-icon><Plus /></el-icon>新增组织
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>导入组织
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>导出组织
        </el-button>
      </div>
    </div>

    <div class="org-content">
      <!-- 左侧组织树 -->
      <div class="org-tree-container">
        <div class="tree-header">
          <h3>组织结构</h3>
          <el-input
            v-model="treeSearchText"
            placeholder="搜索组织"
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

      <!-- 右侧组织详情和成员列表 -->
      <div class="org-detail-container" v-if="currentDept">
        <!-- 组织详情 -->
        <div class="detail-section">
          <div class="section-header">
            <h3>组织详情</h3>
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
              <el-descriptions-item label="组织名称">{{ currentDept.name }}</el-descriptions-item>
              <el-descriptions-item label="上级组织">{{ currentDept.parentId || '-' }}</el-descriptions-item>
              <el-descriptions-item label="排序">{{ currentDept.sort || '-' }}</el-descriptions-item>
              <el-descriptions-item label="组织人数">{{ memberPagination.total }}人</el-descriptions-item>
              <el-descriptions-item label="状态">{{ currentDept.status === '1' ? '启用' : '禁用' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间" :span="2">{{ currentDept.createTime || '-' }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ currentDept.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 组织成员列表 -->
        <div class="members-section">
          <div class="section-header">
            <h3>组织成员 ({{ memberPagination.total }})</h3>
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
              <el-table-column prop="nickname" label="昵称" min-width="100"></el-table-column>
              <el-table-column prop="username" label="用户名" min-width="120"></el-table-column>
              <el-table-column prop="positionNames" label="岗位" min-width="120"></el-table-column>
              <el-table-column prop="email" label="邮箱" min-width="150"></el-table-column>
              <el-table-column prop="mobile" label="电话" min-width="120"></el-table-column>
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

    <!-- 新增/编辑组织弹窗 -->
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
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="deptForm.name" placeholder="请输入组织名称"></el-input>
        </el-form-item>
        <el-form-item label="上级组织" prop="parentId">
          <el-select v-model="deptForm.parentId" placeholder="请选择上级组织">
            <el-option label="顶级组织" :value="0"></el-option>
            <el-option
              v-for="dept in deptOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="deptForm.sort" :min="1" :max="999"></el-input-number>
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
          <el-switch v-model="deptForm.status" active-value="1" inactive-value="2"></el-switch>
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
import { ref, reactive, onMounted, markRaw } from 'vue'
import { Plus, Upload, Download, OfficeBuilding as RawOfficeBuilding } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createOrg, deleteOrgs, getOrgDetail, getOrgTree, queryUsers, updateOrg } from '@/api/upms'
import type { SysOrgTreeNode } from '@/types/upms'

// 使用 markRaw 标记图标组件为非响应式
const OfficeBuilding = markRaw(RawOfficeBuilding)

// 组织树搜索文本
const treeSearchText = ref('')

// 组织树引用
const orgTreeRef = ref<any>()

// 组织树数据
const deptTree = ref<any[]>([])

// 组织树配置
const deptTreeProps = {
  children: 'children',
  label: 'name'
}

// 当前选中的组织
const currentDept = ref<any>(null)

// 组织列表选项（用于选择上级组织）
const deptOptions = ref<any[]>([])

// 组织成员列表数据
const memberList = ref<any[]>([])

// 成员分页配置
const memberPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增组织')

// 组织表单引用
const deptFormRef = ref<FormInstance>()

// 组织表单数据
const deptForm = reactive({
  id: 0,
  name: '',
  parentId: 0,
  sort: 1,
  status: '1',
  remark: ''
})

// 组织表单验证规则
const deptRules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { min: 2, max: 50, message: '组织名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
})

// 页面加载时初始化数据
onMounted(() => {
  void initOrgTree()
})

const initOrgTree = async () => {
  const response = await getOrgTree()
  deptTree.value = response.data
  flattenDeptTree(deptTree.value)
  if (deptTree.value.length > 0) {
    await handleNodeClick(deptTree.value[0])
  } else {
    currentDept.value = null
  }
}

// 扁平化组织树，用于选择上级组织
const flattenDeptTree = (tree: SysOrgTreeNode[], prefix = '', options: any[] = []) => {
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

// 组织节点点击事件
const handleNodeClick = async (data: any) => {
  const response = await getOrgDetail(data.id)
  currentDept.value = response.data
  await loadMemberList(data.id)
}

// 加载组织成员列表
const loadMemberList = async (deptId: number) => {
  const response = await queryUsers({
    current: memberPagination.currentPage,
    size: memberPagination.pageSize,
    orgIds: String(deptId),
  })

  memberList.value = response.data.records.map((user) => ({
    ...user,
    nickname: user.nickname || '-',
    mobile: user.mobile || '-',
    positionNames: user.posts?.map((item) => item.name).join('、') || '-',
  }))
  memberPagination.total = response.data.total
}

// 新增组织
const handleAddDept = () => {
  dialogTitle.value = '新增组织'
  resetDeptForm()
  deptForm.parentId = currentDept.value?.id || 0
  dialogVisible.value = true
}

// 编辑组织
const handleEditDept = async (row: any) => {
  dialogTitle.value = '编辑组织'
  const response = await getOrgDetail(row.id)
  Object.assign(deptForm, {
    id: response.data.id,
    name: response.data.name,
    parentId: response.data.parentId || 0,
    sort: response.data.sort || 1,
    status: response.data.status || '1',
    remark: response.data.remark || '',
  })
  dialogVisible.value = true
}

// 删除组织
const handleDeleteDept = async (row: any) => {
  if (!row) return

  ElMessageBox.confirm('确定要删除该组织吗？删除后该组织下的所有子组织也将被删除', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteOrgs([row.id])
    ElMessage.success('删除组织成功')
    await initOrgTree()
  }).catch(() => {
    // 取消删除
  })
}

// 提交组织表单
const handleSubmitDept = async () => {
  if (!deptFormRef.value) return
  try {
    await deptFormRef.value.validate()
    const payload = {
      id: deptForm.id || undefined,
      name: deptForm.name,
      parentId: deptForm.parentId || undefined,
      sort: deptForm.sort,
      status: deptForm.status,
      remark: deptForm.remark || undefined,
    }

    if (deptForm.id) {
      await updateOrg(payload)
      ElMessage.success('编辑组织成功')
    } else {
      await createOrg(payload)
      ElMessage.success('新增组织成功')
    }
    dialogVisible.value = false
    await initOrgTree()
  } catch (error) {
    console.log('表单验证失败', error)
  }
}

// 重置组织表单
const resetDeptForm = () => {
  Object.assign(deptForm, {
    id: 0,
    name: '',
    parentId: 0,
    sort: 1,
    status: '1',
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
  if (currentDept.value?.id) {
    void loadMemberList(currentDept.value.id)
  }
}

// 成员当前页码变化
const handleMemberCurrentChange = (page: number) => {
  memberPagination.currentPage = page
  if (currentDept.value?.id) {
    void loadMemberList(currentDept.value.id)
  }
}

// 成员选择变化
const handleMemberSelectionChange = (selection: any[]) => {
  // 处理成员选择逻辑
}

// 添加成员
const handleAddMember = () => {
  ElMessage.info('添加成员功能待实现')
}

// 导入组织
const handleImport = () => {
  ElMessage.info('导入组织功能待实现')
}

// 导出组织
const handleExport = () => {
  ElMessage.info('导出组织功能待实现')
}

// 组织节点右键菜单
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
