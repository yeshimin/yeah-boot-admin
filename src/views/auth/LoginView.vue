<template>
  <div class="login-container">
    <div class="login-panel">
      <div
        v-if="loginPageOptions.noticeEnabled && loginPageOptions.noticeContent"
        class="login-notice"
      >
        <el-alert
          :title="loginPageOptions.noticeTitle || '提示'"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="login-notice-content">{{ loginPageOptions.noticeContent }}</div>
          </template>
        </el-alert>
      </div>
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
            <el-checkbox v-model="loginForm.remember">记住用户名</el-checkbox>
            <div class="login-form-links">
              <el-link
                v-if="loginPageOptions.registerEnabled"
                type="primary"
                :underline="false"
                @click="openRegisterDialog"
              >
                注册账号
              </el-link>
              <el-link
                type="primary"
                :underline="false"
                class="login-form-forgot"
                @click="handleForgotPassword"
              >
                忘记密码？
              </el-link>
            </div>
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

    <el-dialog
      v-model="registerDialogVisible"
      title="注册账号"
      width="420px"
      :close-on-click-modal="!registerLoading"
      :close-on-press-escape="!registerLoading"
      :show-close="!registerLoading"
      @closed="resetRegisterForm"
    >
      <el-alert title="注册账号仅拥有受限体验权限。" type="warning" :closable="false" show-icon />
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="code">
          <div class="captcha-row">
            <el-input v-model="registerForm.code" placeholder="请输入验证码" prefix-icon="Key" />
            <button type="button" class="captcha-trigger" @click="loadRegisterCaptcha">
              <img
                v-if="registerCaptchaImage"
                :src="registerCaptchaImage"
                alt="验证码"
                class="captcha-image"
              />
              <span v-else>获取验证码</span>
            </button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="registerLoading" @click="registerDialogVisible = false"
          >取消</el-button
        >
        <el-button type="primary" :loading="registerLoading" @click="handleRegister"
          >注册</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getRegisterCaptcha, register } from '@/api/auth'
import { getPublicSysConfigs } from '@/api/upms'
import { sha256Hex } from '@/utils/crypto'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const REMEMBERED_USERNAME_KEY = 'yeah-boot-admin-remembered-username'

// 登录表单引用
const loginFormRef = ref<FormInstance>()

// 登录加载状态
const loginLoading = ref(false)
const captchaEnabled = ref(false)
const captchaImage = ref('')
const registerDialogVisible = ref(false)
const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)
const registerCaptchaImage = ref('')
const loginPageOptions = reactive({
  noticeEnabled: false,
  noticeTitle: '',
  noticeContent: '',
  registerEnabled: false,
})

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  key: '',
  remember: false,
  terminal: 'web' as const,
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  key: '',
  code: '',
})

// 登录表单验证规则
const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur' },
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
    },
  ],
})

const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 32, message: '用户名长度在 2 到 32 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入密码'))
          return
        }
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
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
    captchaImage.value = captcha.image
      ? captcha.image.startsWith('data:image/')
        ? captcha.image
        : `data:image/png;base64,${captcha.image}`
      : ''
  } catch {
    captchaEnabled.value = false
    loginForm.key = ''
    captchaImage.value = ''
  }
}

const loadLoginPageOptions = async () => {
  try {
    const response = await getPublicSysConfigs({ groupCode: 'auth.login' })
    const values = new Map(response.data.map((item) => [item.name, item.value]))
    Object.assign(loginPageOptions, {
      noticeEnabled: values.get('auth.login.notice.enabled') === 'true',
      noticeTitle: values.get('auth.login.notice.title') || '',
      noticeContent: values.get('auth.login.notice.content') || '',
      registerEnabled: values.get('auth.login.register.enabled') === 'true',
    })
  } catch {
    Object.assign(loginPageOptions, {
      noticeEnabled: false,
      noticeTitle: '',
      noticeContent: '',
      registerEnabled: false,
    })
  }
}

const loadRegisterCaptcha = async () => {
  try {
    const captcha = await getRegisterCaptcha()
    registerForm.key = captcha.data.key || ''
    registerForm.code = ''
    registerCaptchaImage.value = captcha.data.image
      ? captcha.data.image.startsWith('data:image/')
        ? captcha.data.image
        : `data:image/png;base64,${captcha.data.image}`
      : ''
  } catch {
    registerForm.key = ''
    registerCaptchaImage.value = ''
  }
}

const resetRegisterForm = () => {
  Object.assign(registerForm, {
    username: '',
    password: '',
    confirmPassword: '',
    key: '',
    code: '',
  })
  registerCaptchaImage.value = ''
  registerFormRef.value?.clearValidate()
}

const openRegisterDialog = async () => {
  if (!loginPageOptions.registerEnabled) {
    return
  }
  resetRegisterForm()
  registerDialogVisible.value = true
  await loadRegisterCaptcha()
}

const handleRegister = async () => {
  if (!registerFormRef.value || registerLoading.value) return

  try {
    await registerFormRef.value.validate()
    registerLoading.value = true
    await register({
      username: registerForm.username.trim(),
      password: await sha256Hex(registerForm.password.trim()),
      key: registerForm.key,
      code: registerForm.code,
    })
    loginForm.username = registerForm.username.trim()
    loginForm.password = ''
    registerDialogVisible.value = false
    ElMessage.success('注册成功，请登录')
  } catch {
    await loadRegisterCaptcha()
  } finally {
    registerLoading.value = false
  }
}

const handleForgotPassword = () => {
  ElMessage.info('请联系管理员')
}

const loadRememberedUsername = () => {
  const username = localStorage.getItem(REMEMBERED_USERNAME_KEY) || ''
  loginForm.username = username
  loginForm.remember = Boolean(username)
}

const saveRememberedUsername = () => {
  if (loginForm.remember) {
    localStorage.setItem(REMEMBERED_USERNAME_KEY, loginForm.username.trim())
    return
  }
  localStorage.removeItem(REMEMBERED_USERNAME_KEY)
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
    saveRememberedUsername()
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
  loadRememberedUsername()
  void loadLoginPageOptions()
  void loadCaptcha()
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
  width: 100%;
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

.login-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(400px, calc(100vw - 32px));
}

.login-notice {
  filter: drop-shadow(0 8px 18px rgba(52, 37, 8, 0.24));
}

.login-notice-content {
  line-height: 1.6;
  white-space: pre-line;
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
  width: 100%;
}

.login-form-extra :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
}

.login-form-submit {
  width: 100%;
}

.login-form-forgot {
  font-size: 14px;
}

.login-form-links {
  display: flex;
  gap: 16px;
}

.register-form {
  padding-top: 20px;
}
</style>
