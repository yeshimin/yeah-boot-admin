<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>管理后台</h2>
        <p>欢迎回来，请登录</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item class="login-form-extra">
          <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
          <el-link type="primary" :underline="false" class="login-form-forgot">
            忘记密码？
          </el-link>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="login-form-submit"
            :loading="loginLoading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()

// 登录表单引用
const loginFormRef = ref<FormInstance>()

// 登录加载状态
const loginLoading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 登录表单验证规则
const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    // 表单验证
    await loginFormRef.value.validate()
    loginLoading.value = true

    // 模拟登录请求
    setTimeout(() => {
      loginLoading.value = false
      // 保存登录状态
      localStorage.setItem('token', 'mock-token')
      // 跳转到首页
      router.push({ path: '/system/user' })
      console.log('登录成功，跳转至 /system/user')
    }, 1500)
  } catch (error) {
    console.log('登录失败', error)
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-header {
  padding: 30px 30px 0;
  text-align: center;
}

.login-header h2 {
  margin: 0 0 10px;
  font-size: 24px;
  color: #303133;
}

.login-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.login-form {
  padding: 30px;
}

.login-form-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-form-submit {
  width: 100%;
}

.login-form-forgot {
  font-size: 14px;
}
</style>
