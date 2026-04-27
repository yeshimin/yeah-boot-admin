<template>
  <div class="file-manage-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="原始文件名">
          <el-input v-model="searchForm.originalName" placeholder="请输入原始文件名" clearable />
        </el-form-item>
        <el-form-item label="文件Key">
          <el-input v-model="searchForm.fileKey" placeholder="请输入文件Key" clearable />
        </el-form-item>
        <el-form-item label="存储类型">
          <el-select v-model="searchForm.storageType" placeholder="请选择存储类型" clearable>
            <el-option
              v-for="option in STORAGE_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
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
        <el-button type="primary" @click="dialogVisible = true">
          <el-icon><Upload /></el-icon>上传文件
        </el-button>
        <el-button @click="getFileList">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        v-loading="tableLoading"
        :data="fileList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="originalName" label="原始文件名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="fileKey" label="文件Key" min-width="220" show-overflow-tooltip />
        <el-table-column prop="suffix" label="后缀" width="90" show-overflow-tooltip />
        <el-table-column prop="storageType" label="存储类型" width="100">
          <template #default="{ row }">
            {{ formatStorageType(row.storageType) }}
          </template>
        </el-table-column>
        <el-table-column prop="bucket" label="Bucket" min-width="120" show-overflow-tooltip />
        <el-table-column prop="path" label="路径" min-width="120" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="176" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">详情</el-button>
            <el-button link type="primary" @click="handleDownload(row)">下载</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="上传文件"
      width="520px"
      @close="handleDialogClose"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="存储类型" prop="storageType">
          <el-select v-model="uploadForm.storageType" placeholder="请选择存储类型" style="width: 100%">
            <el-option
              v-for="option in STORAGE_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="String(option.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件" required>
          <div class="upload-field">
            <input
              ref="fileInputRef"
              class="upload-input"
              type="file"
              @change="handleFileChange"
            />
            <el-button @click="triggerFileSelect">选择文件</el-button>
            <span class="upload-file-name">{{ selectedFile?.name || '未选择文件' }}</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="uploading" @click="handleUpload">上传</el-button>
        </span>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="文件详情" size="48%">
      <el-descriptions v-if="currentDetail" :column="1" border>
        <el-descriptions-item label="ID">{{ currentDetail.id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="原始文件名">{{ currentDetail.originalName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="文件Key">{{ currentDetail.fileKey || '-' }}</el-descriptions-item>
        <el-descriptions-item label="后缀">{{ currentDetail.suffix || '-' }}</el-descriptions-item>
        <el-descriptions-item label="存储类型">
          {{ formatStorageType(currentDetail.storageType) }}
        </el-descriptions-item>
        <el-descriptions-item label="基础路径">{{ currentDetail.basePath || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Bucket">{{ currentDetail.bucket || '-' }}</el-descriptions-item>
        <el-descriptions-item label="路径">{{ currentDetail.path || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentDetail.createBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentDetail.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新人">{{ currentDetail.updateBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentDetail.updateTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Refresh, Upload } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteFile, downloadFile, getFileDetail, queryFiles, uploadFile } from '@/api/file'
import type { ManagedFileRecord, FileUploadFormModel } from '@/types/file'
import { buildConditions } from '@/utils/query'

type UnknownRecord = Record<string, unknown>

const uploadFormRef = ref<FormInstance>()
const fileInputRef = ref<HTMLInputElement>()
const tableLoading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileList = ref<ManagedFileRecord[]>([])
const currentDetail = ref<ManagedFileRecord | null>(null)
const STORAGE_TYPE_OPTIONS = [
  { value: 1, label: '本地' },
  { value: 2, label: '七牛' },
  { value: 3, label: 'MinIO' },
]

const searchForm = reactive({
  originalName: '',
  fileKey: '',
  storageType: undefined as number | undefined,
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
})

const uploadForm = reactive<FileUploadFormModel>({
  storageType: '1',
})

const uploadRules = reactive<FormRules>({
  storageType: [
    { required: true, message: '请输入存储类型', trigger: 'blur' },
  ],
})

function toNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
  }
  return 0
}

function toText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function toBooleanLike(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    if (value === 'true' || value === '1') {
      return true
    }
    if (value === 'false' || value === '0') {
      return false
    }
  }
  return value as boolean | string | undefined
}

function normalizeFileRecord(record: unknown): ManagedFileRecord {
  const raw = (record || {}) as UnknownRecord
  return {
    id: toNumber(raw.id),
    fileKey: toText(raw.fileKey, raw.key),
    originalName: toText(raw.originalName, raw.fileName, raw.filename, raw.name, raw.originalFilename, raw.originalName) || '-',
    storageType: toNumber(raw.storageType),
    basePath: toText(raw.basePath),
    bucket: toText(raw.bucket),
    path: toText(raw.path),
    suffix: toText(raw.suffix),
    createBy: toText(raw.createBy),
    createTime: toText(raw.createTime, raw.gmtCreate),
    updateBy: toText(raw.updateBy),
    updateTime: toText(raw.updateTime, raw.gmtUpdate),
  }
}

function buildQueryParams() {
  return {
    current: pagination.currentPage,
    size: pagination.pageSize,
    conditions_: buildConditions([
      { field: 'originalName', operator: 'like', value: searchForm.originalName },
      { field: 'fileKey', operator: 'like', value: searchForm.fileKey },
      { field: 'storageType', operator: 'eq', value: searchForm.storageType },
      { field: 'id', operator: 'sort', value: 'desc' },
    ]),
  }
}

async function getFileList() {
  tableLoading.value = true
  try {
    const response = await queryFiles(buildQueryParams())
    fileList.value = (response.data.records || []).map((item) => normalizeFileRecord(item))
    pagination.total = response.data.total
  } finally {
    tableLoading.value = false
  }
}

async function handleSearch() {
  pagination.currentPage = 1
  await getFileList()
}

async function handleReset() {
  Object.assign(searchForm, {
    originalName: '',
    fileKey: '',
    storageType: undefined,
  })
  pagination.currentPage = 1
  await getFileList()
}

async function handleSizeChange(size: number) {
  pagination.pageSize = size
  await getFileList()
}

async function handleCurrentChange(page: number) {
  pagination.currentPage = page
  await getFileList()
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
  input.value = ''
}

function resetUploadForm() {
  uploadForm.storageType = '1'
  selectedFile.value = null
  uploadFormRef.value?.clearValidate()
}

function handleDialogClose() {
  resetUploadForm()
}

async function handleUpload() {
  if (!uploadFormRef.value) {
    return
  }

  await uploadFormRef.value.validate()
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  try {
    await uploadFile({
      file: selectedFile.value,
      storageType: uploadForm.storageType.trim(),
    })
    dialogVisible.value = false
    resetUploadForm()
    ElMessage.success('文件上传成功')
    await getFileList()
  } finally {
    uploading.value = false
  }
}

async function handleViewDetail(row: ManagedFileRecord) {
  const response = await getFileDetail(row.id)
  currentDetail.value = normalizeFileRecord(response.data)
  detailVisible.value = true
}

async function handleDownload(row: ManagedFileRecord) {
  if (!row.fileKey) {
    ElMessage.warning('当前文件缺少 fileKey，无法下载')
    return
  }

  const { blob, fileName } = await downloadFile(row.fileKey, row.originalName || row.fileKey)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || row.fileKey
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function handleDelete(row: ManagedFileRecord) {
  if (!row.fileKey) {
    ElMessage.warning('当前文件缺少 fileKey，无法删除')
    return
  }

  ElMessageBox.confirm('确定要删除该文件吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteFile(row.fileKey)
    ElMessage.success('删除文件成功')
    await getFileList()
  }).catch(() => {
    // 用户取消
  })
}

function formatStorageType(value?: number) {
  return STORAGE_TYPE_OPTIONS.find((item) => item.value === value)?.label || String(value || '-')
}

void getFileList()
</script>

<style scoped>
.file-manage-container {
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
}

.search-form {
  display: flex;
  align-items: center;
}

.table-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.upload-field {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.upload-input {
  display: none;
}

.upload-file-name {
  color: #606266;
  font-size: 13px;
  word-break: break-all;
}
</style>
