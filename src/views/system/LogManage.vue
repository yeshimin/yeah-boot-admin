<template>
  <div class="log-manage-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="类别">
          <el-input v-model="searchForm.category" placeholder="请输入类别" clearable></el-input>
        </el-form-item>
        <el-form-item label="事件">
          <el-input v-model="searchForm.event" placeholder="请输入事件" clearable></el-input>
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="searchForm.createBy" placeholder="请输入执行人" clearable></el-input>
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="searchForm.success" placeholder="请选择结果" clearable>
            <el-option label="成功" value="1"></el-option>
            <el-option label="失败" value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      v-loading="tableLoading"
      :data="logList"
      stripe
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="90"></el-table-column>
      <el-table-column prop="triggerType" label="触发类型" width="110">
        <template #default="{ row }">
          {{ getTriggerTypeLabel(row.triggerType) }}
        </template>
      </el-table-column>
      <el-table-column prop="category" label="类别" width="120">
        <template #default="{ row }">
          {{ getCategoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column prop="event" label="事件" min-width="160"></el-table-column>
      <el-table-column prop="comment" label="方法" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="createBy" label="执行人" min-width="120"></el-table-column>
      <el-table-column prop="success" label="结果" width="100">
        <template #default="{ row }">
          <el-tag :type="row.success === '1' ? 'success' : 'danger'">
            {{ row.success === '1' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="time" label="耗时(ms)" width="110"></el-table-column>
      <el-table-column prop="input" label="输入" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="output" label="输出" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="extra" label="额外信息" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="createTime" label="时间" min-width="180"></el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
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

    <el-drawer v-model="detailVisible" title="日志详情" size="50%">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="触发类型">
          {{ getTriggerTypeLabel(currentLog.triggerType) }}
        </el-descriptions-item>
        <el-descriptions-item label="类别">
          {{ getCategoryLabel(currentLog.category) }}
        </el-descriptions-item>
        <el-descriptions-item label="事件">{{ currentLog.event || '-' }}</el-descriptions-item>
        <el-descriptions-item label="执行人">{{ currentLog.createBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结果">
          {{ currentLog.success === '1' ? '成功' : '失败' }}
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.time || 0 }} ms</el-descriptions-item>
        <el-descriptions-item label="时间">{{ currentLog.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="方法">{{ currentLog.comment || '-' }}</el-descriptions-item>
        <el-descriptions-item label="输入">{{ currentLog.input || '-' }}</el-descriptions-item>
        <el-descriptions-item label="输出">{{ currentLog.output || '-' }}</el-descriptions-item>
        <el-descriptions-item label="额外信息">{{ currentLog.extra || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { queryLogs } from '@/api/upms'
import type { SysLogEntity } from '@/types/upms'
import { buildConditions } from '@/utils/query'

const tableLoading = ref(false)
const logList = ref<SysLogEntity[]>([])
const detailVisible = ref(false)
const currentLog = ref<SysLogEntity | null>(null)

const searchForm = reactive({
  category: '',
  event: '',
  createBy: '',
  success: '',
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0,
})

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  '1': '系统自动',
  '2': '用户手动',
}

const CATEGORY_LABELS: Record<string, string> = {
  '1': '鉴权相关',
  '2': '数据操作',
  '3': '定时任务',
  '4': '上传下载',
}

async function getLogList() {
  tableLoading.value = true
  try {
    const response = await queryLogs({
      current: pagination.currentPage,
      size: pagination.pageSize,
      conditions_: buildConditions([
        { field: 'category', operator: 'like', value: searchForm.category },
        { field: 'event', operator: 'like', value: searchForm.event },
        { field: 'createBy', operator: 'like', value: searchForm.createBy },
      ]),
      success: searchForm.success || undefined,
    })
    logList.value = response.data.records
    pagination.total = response.data.total
  } finally {
    tableLoading.value = false
  }
}

async function handleSearch() {
  pagination.currentPage = 1
  await getLogList()
}

async function handleReset() {
  Object.assign(searchForm, {
    category: '',
    event: '',
    createBy: '',
    success: '',
  })
  pagination.currentPage = 1
  await getLogList()
}

async function handleSizeChange(size: number) {
  pagination.pageSize = size
  await getLogList()
}

async function handleCurrentChange(page: number) {
  pagination.currentPage = page
  await getLogList()
}

function getTriggerTypeLabel(value?: string) {
  return TRIGGER_TYPE_LABELS[value || ''] || value || '-'
}

function getCategoryLabel(value?: string) {
  return CATEGORY_LABELS[value || ''] || value || '-'
}

function openDetail(log: SysLogEntity) {
  currentLog.value = log
  detailVisible.value = true
}

void getLogList()
</script>

<style scoped>
.log-manage-container {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
