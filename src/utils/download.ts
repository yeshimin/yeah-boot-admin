import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'
import { getToken } from './auth'
import { handleUnauthorized } from './session'

export interface DownloadResult {
  blob: Blob
  fileName: string
}

export function resolveApiUrl(path: string) {
  if (import.meta.env.DEV) {
    return `/api${path}`
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
  return `${baseUrl}${path}`
}

export function parseFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) {
    return fallback
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (basicMatch?.[1]) {
    return basicMatch[1]
  }

  return fallback
}

function isJsonResponse(response: Response) {
  return response.headers.get('content-type')?.toLowerCase().includes('json') || false
}

async function readJsonPayload(response: Response) {
  const text = await response.clone().text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as Partial<ApiResponse<unknown>>
  } catch {
    return null
  }
}

async function rejectDownload(response: Response, fallbackMessage: string): Promise<never> {
  const payload = isJsonResponse(response) ? await readJsonPayload(response) : null
  const code = payload?.code ?? response.status
  const message = response.ok && code === 0 ? fallbackMessage : payload?.message || fallbackMessage

  if (code === 401 || response.status === 401) {
    await handleUnauthorized(message || '登录状态已失效，请重新登录')
    throw new Error(message || 'Unauthorized')
  }

  ElMessage.error(message)
  throw new Error(message)
}

export async function downloadByUrl(url: string, fallbackName: string): Promise<DownloadResult> {
  const token = getToken()
  let response: Response

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    })
  } catch (error) {
    ElMessage.error('下载请求失败，请检查网络或后端服务')
    throw error
  }

  if (!response.ok) {
    return rejectDownload(response, `下载失败：${response.status}`)
  }

  if (isJsonResponse(response)) {
    return rejectDownload(response, '下载失败：接口未返回文件内容')
  }

  return {
    blob: await response.blob(),
    fileName: parseFileName(response.headers.get('content-disposition'), fallbackName),
  }
}
