<template>
  <div class="profile-view">
    <section class="profile-hero">
      <div class="profile-hero__identity">
        <el-avatar :size="72" :src="avatarUrl || defaultAvatar" class="profile-hero__avatar" />
        <div class="profile-hero__meta">
          <h1>{{ authStore.displayName }}</h1>
          <p>{{ user?.username || '-' }}</p>
          <div class="profile-hero__tags">
            <el-tag :type="statusTagType" effect="light">{{ statusText }}</el-tag>
            <el-tag v-if="primaryRoleName" effect="plain">{{ primaryRoleName }}</el-tag>
            <el-tag v-if="user?.mobile" effect="plain">{{ user.mobile }}</el-tag>
          </div>
        </div>
      </div>

      <div class="profile-hero__actions">
        <el-button @click="goWorkbench">返回工作台</el-button>
        <el-button type="primary" :loading="refreshing" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新资料
        </el-button>
      </div>
    </section>

    <el-row :gutter="20" class="profile-main">
      <el-col :xl="14" :lg="14" :md="24">
        <el-card shadow="never" class="profile-card">
          <template #header>
            <div class="profile-card__header">
              <span>基础资料</span>
              <el-tag effect="plain">当前登录用户</el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">{{ user?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ user?.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ user?.mobile || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user?.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderText }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ statusText }}</el-descriptions-item>
            <el-descriptions-item label="角色" :span="2">{{ roleNamesText }}</el-descriptions-item>
            <el-descriptions-item label="组织" :span="2">{{ orgNamesText }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ user?.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

      </el-col>

      <el-col :xl="10" :lg="10" :md="24">
        <el-card shadow="never" class="profile-card">
          <template #header>
            <div class="profile-card__header">
              <span>编辑资料</span>
              <el-tag effect="plain">updateMine</el-tag>
            </div>
          </template>

          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="88px"
            class="profile-form"
          >
            <el-form-item label="头像" prop="avatar">
              <div class="avatar-field">
                <el-avatar :size="52" :src="avatarPreview || defaultAvatar" />
                <div class="avatar-field__body">
                  <div class="avatar-actions">
                    <input
                      ref="avatarInputRef"
                      class="avatar-input"
                      type="file"
                      accept="image/*"
                      @change="handleAvatarFileChange"
                    />
                    <el-button :loading="avatarUploading" @click="triggerAvatarSelect">上传头像</el-button>
                    <el-button link @click="profileForm.avatar = ''">清空</el-button>
                  </div>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" clearable />
            </el-form-item>
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model="profileForm.mobile" placeholder="请输入手机号" clearable />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" clearable />
            </el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="profileForm.gender">
                <el-radio value="0">保密</el-radio>
                <el-radio value="1">男</el-radio>
                <el-radio value="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item class="form-actions">
              <el-button @click="resetProfileForm">重置</el-button>
              <el-button type="primary" :loading="profileSaving" @click="handleSubmitProfile">
                保存资料
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="profile-card">
          <template #header>
            <div class="profile-card__header">
              <span>修改密码</span>
              <el-tag effect="plain">SHA-256</el-tag>
            </div>
          </template>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="88px"
            class="profile-form"
          >
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
                clearable
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="请输入新密码"
                clearable
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
                clearable
              />
            </el-form-item>
            <el-form-item class="form-actions">
              <el-button @click="resetPasswordForm">清空</el-button>
              <el-button type="primary" :loading="passwordSaving" @click="handleSubmitPassword">
                更新密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getStoragePreviewUrl, uploadStorageFile } from '@/api/storage'
import { updateMine } from '@/api/upms'
import { useAuthStore } from '@/stores/auth'
import type { UpdateMineRequest } from '@/types/upms'
import { sha256Hex } from '@/utils/crypto'

const router = useRouter()
const authStore = useAuthStore()
const refreshing = ref(false)
const avatarUploading = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const avatarInputRef = ref<HTMLInputElement>()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const maxAvatarSizeInMb = 5

const user = computed(() => authStore.mine?.user || null)
const primaryRoleName = computed(() => authStore.mine?.roles?.[0]?.name || '')
const roleNamesText = computed(() => authStore.mine?.roles?.map((item) => item.name).join('、') || '-')
const orgNamesText = computed(() => authStore.mine?.orgs?.map((item) => item.name).join('、') || '-')

const profileForm = reactive({
  nickname: '',
  mobile: '',
  email: '',
  gender: '0',
  avatar: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function resolveAvatarUrl(avatar?: string) {
  if (!avatar) {
    return ''
  }
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  if (avatar.startsWith('/')) {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'}${avatar}`
  }
  return getStoragePreviewUrl(avatar)
}

function normalizeGender(value?: string) {
  return ['0', '1', '2'].includes(value || '') ? String(value) : '0'
}

const avatarUrl = computed(() => resolveAvatarUrl(user.value?.avatar))
const avatarPreview = computed(() => resolveAvatarUrl(profileForm.avatar) || avatarUrl.value)

const genderText = computed(() => {
  if (user.value?.gender === '1') {
    return '男'
  }
  if (user.value?.gender === '2') {
    return '女'
  }
  if (user.value?.gender === '0') {
    return '保密'
  }
  return '-'
})

const statusText = computed(() => {
  if (user.value?.status === '1') {
    return '启用'
  }
  if (user.value?.status === '2') {
    return '禁用'
  }
  return '未知'
})

const statusTagType = computed(() => (user.value?.status === '2' ? 'danger' : 'success'))

const profileRules = reactive<FormRules>({
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  mobile: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        if (!/^1\d{10}$/.test(String(value).trim())) {
          callback(new Error('手机号格式不正确'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
          callback(new Error('邮箱格式不正确'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
})

const passwordRules = reactive<FormRules>({
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' },
    { min: 6, message: '旧密码长度不能少于 6 位', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请再次输入新密码'))
          return
        }
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
})

function syncProfileForm() {
  Object.assign(profileForm, {
    nickname: user.value?.nickname || '',
    mobile: user.value?.mobile || '',
    email: user.value?.email || '',
    gender: normalizeGender(user.value?.gender),
    avatar: user.value?.avatar || '',
  })
}

function resetProfileForm() {
  syncProfileForm()
  profileFormRef.value?.clearValidate()
}

function resetPasswordForm() {
  Object.assign(passwordForm, {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  passwordFormRef.value?.clearValidate()
}

function triggerAvatarSelect() {
  avatarInputRef.value?.click()
}

async function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return
  }

  if (file.size > maxAvatarSizeInMb * 1024 * 1024) {
    ElMessage.error(`头像大小不能超过 ${maxAvatarSizeInMb}MB`)
    return
  }

  avatarUploading.value = true
  try {
    const response = await uploadStorageFile({
      file,
      storageType: '1',
      isPublic: 'true',
      isUsed: 'false',
      path: 'tempdir0129',
    })
    profileForm.avatar = response.data.fileKey
    ElMessage.success('头像上传成功')
  } finally {
    avatarUploading.value = false
  }
}

watch(
  () => user.value,
  () => {
    syncProfileForm()
  },
  { immediate: true },
)

async function handleRefresh() {
  refreshing.value = true
  try {
    await authStore.refreshProfile()
    ElMessage.success('个人资料已刷新')
  } finally {
    refreshing.value = false
  }
}

async function handleSubmitProfile() {
  if (!profileFormRef.value) {
    return
  }

  await profileFormRef.value.validate()
  profileSaving.value = true
  try {
    const payload: UpdateMineRequest = {
      nickname: profileForm.nickname.trim(),
      mobile: profileForm.mobile.trim(),
      email: profileForm.email.trim(),
      gender: normalizeGender(profileForm.gender),
      avatar: profileForm.avatar.trim(),
    }
    await updateMine(payload)
    await authStore.refreshProfile()
    resetProfileForm()
    ElMessage.success('个人资料保存成功')
  } finally {
    profileSaving.value = false
  }
}

async function handleSubmitPassword() {
  if (!passwordFormRef.value) {
    return
  }

  await passwordFormRef.value.validate()
  passwordSaving.value = true
  try {
    await updateMine({
      oldPassword: await sha256Hex(passwordForm.oldPassword.trim()),
      newPassword: await sha256Hex(passwordForm.newPassword.trim()),
    })
    resetPasswordForm()
    ElMessage.success('密码修改成功')
  } finally {
    passwordSaving.value = false
  }
}

function goWorkbench() {
  router.push(authStore.firstAccessiblePath || '/')
}
</script>

<style scoped>
.profile-view {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  background:
    radial-gradient(circle at top right, rgba(64, 158, 255, 0.1), transparent 30%),
    linear-gradient(180deg, #f5f7fa 0%, #eef3f9 100%);
}

.profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  border: 1px solid rgba(64, 158, 255, 0.12);
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(24, 144, 255, 0.12), rgba(255, 255, 255, 0.96)),
    #fff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.profile-hero__identity {
  display: flex;
  align-items: center;
  gap: 18px;
}

.profile-hero__avatar {
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 24px rgba(64, 158, 255, 0.18);
}

.profile-hero__meta h1 {
  margin: 0 0 8px;
  font-size: 28px;
  color: #1f2937;
}

.profile-hero__meta p {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
}

.profile-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.profile-hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-main {
  margin-top: 20px;
}

.profile-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.profile-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.avatar-field {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
}

.avatar-field__body {
  flex: 1;
}

.avatar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar-input {
  display: none;
}

.form-actions :deep(.el-form-item__content) {
  justify-content: flex-end;
}

@media (max-width: 992px) {
  .profile-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-hero__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .profile-view {
    padding: 16px;
  }

  .profile-hero {
    padding: 20px;
  }

  .profile-hero__identity {
    align-items: flex-start;
    flex-direction: column;
  }

  .avatar-field {
    flex-direction: column;
  }

  .avatar-actions {
    flex-wrap: wrap;
  }
}
</style>
