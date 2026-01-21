<template>
  <div class="error-container error-500">
    <div class="error-code">500</div>
    <div class="error-message">抱歉，服务器内部错误</div>
    <div class="error-description">
      服务器遇到了一个意外情况，无法完成您的请求。
      请稍后重试或联系管理员。
    </div>
    <div class="error-actions">
      <el-button type="primary" @click="goHome">返回首页</el-button>
      <el-button @click="refreshPage">刷新页面</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const refreshPage = () => {
  window.location.reload()
}
</script>

<style scoped>
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-color: #f5f7fa;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-message {
  font-size: 20px;
  color: #606266;
  margin-bottom: 10px;
}

.error-description {
  font-size: 14px;
  color: #909399;
  margin-bottom: 30px;
  max-width: 400px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 16px;
}
</style>
