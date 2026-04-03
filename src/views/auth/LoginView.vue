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
        @keyup.enter="handleLogin"
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
        <el-form-item v-if="captchaEnabled" prop="code">
          <div class="captcha-row">
            <el-input
              v-model="loginForm.code"
              placeholder="请输入验证码"
              prefix-icon="Key"
            ></el-input>
            <button type="button" class="captcha-trigger" @click="loadCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="captcha-image" />
              <span v-else>获取验证码</span>
            </button>
          </div>
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
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { sha256Hex } from '@/utils/crypto'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 登录表单引用
const loginFormRef = ref<FormInstance>()

// 登录加载状态
const loginLoading = ref(false)
const captchaEnabled = ref(false)
const captchaImage = ref('')

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  key: '',
  remember: false,
  terminal: 'web' as const,
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
  ],
  code: [
    {
      validator: (_rule, value, callback) => {
        if (!captchaEnabled.value) {
          callback()
          return
        }
        if (!value) {
          callback(new Error('请输入验证码'))
          return
        }
        callback()
      },
      trigger: 'blur',
    }
  ]
})

const redirectPath = () => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect ? redirect : '/system/user'
}

const loadCaptcha = async () => {
  try {
    const captcha = await authStore.refreshCaptcha()
    captchaEnabled.value = Boolean(captcha.enabled)
    loginForm.key = captcha.key || ''
    loginForm.code = ''
    captchaImage.value = captcha.image ? `data:image/png;base64,${captcha.image}` : ''
  } catch {
    captchaEnabled.value = false
    loginForm.key = ''
    captchaImage.value = ''
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    // 表单验证
    await loginFormRef.value.validate()
    loginLoading.value = true
    const hashedPassword = await sha256Hex(loginForm.password.trim())
    await authStore.login({
      username: loginForm.username,
      password: hashedPassword,
      code: captchaEnabled.value ? loginForm.code : undefined,
      key: captchaEnabled.value ? loginForm.key : undefined,
      terminal: loginForm.terminal,
    })
    await router.push(redirectPath())
    ElMessage.success('登录成功')
  } catch {
    if (captchaEnabled.value) {
      await loadCaptcha()
    }
  } finally {
    loginLoading.value = false
  }
}

onMounted(() => {
  loadCaptcha()
})
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

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
  width: 100%;
}

.captcha-trigger {
  display: inline-flex;
  width: 120px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  overflow: hidden;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
