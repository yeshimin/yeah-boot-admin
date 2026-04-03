import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'
import { getToken, removeToken } from './auth'

type RequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean
}

const service = axios.create({
  baseURL: import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'),
  timeout: 10000,
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams()

      const appendValue = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === '') {
          return
        }

        if (Array.isArray(value)) {
          value.forEach((item) => appendValue(key, item))
          return
        }

        searchParams.append(key, String(value))
      }

      Object.entries(params || {}).forEach(([key, value]) => {
        appendValue(key, value)
      })

      return searchParams.toString()
    },
  },
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

service.interceptors.request.use((config) => {
  const nextConfig = config
  const skipAuth = (nextConfig as RequestConfig).skipAuth
  const token = getToken()

  if (!skipAuth && token) {
    nextConfig.headers.Authorization = `Bearer ${token}`
  }

  return nextConfig
})

service.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let message = error.message || '请求失败'

    if (message.includes('Network Error')) {
      message = '后端接口连接异常'
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时'
    } else if (error.response?.status) {
      message = `系统接口 ${error.response.status} 异常`
    }

    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export function request<T>(config: RequestConfig) {
  return service.request<ApiResponse<T>>(config).then((response) => {
    const payload = response.data
    const code = payload?.code ?? 0
    const message = payload?.message || '请求失败'

    if (code === 0) {
      return payload
    }

    if (code === 401) {
      removeToken()
      ElMessage.error(message || '登录状态已失效，请重新登录')
      return Promise.reject(new Error(message || 'Unauthorized'))
    }

    ElMessage.error(message)
    return Promise.reject(new Error(message))
  })
}
