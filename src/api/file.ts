import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'
import type { PageResponse } from '@/types/api'

export function queryFiles(params: Record<string, unknown>) {
  return request<PageResponse<Record<string, unknown>>>({
    url: '/basic/file/crud/query',
    method: 'get',
    params,
  })
}

export function getFileDetail(id: number) {
  return request<Record<string, unknown>>({
    url: '/basic/file/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function uploadFile(payload: { file: File; storageType: string }) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('storageType', payload.storageType)

  return request<Record<string, unknown>>({
    url: '/basic/file/upload',
    method: 'post',
    data: formData,
  })
}

export function deleteFile(fileKey: string) {
  return request<void>({
    url: '/basic/file/delete',
    method: 'post',
    params: { fileKey },
  })
}

function resolveDownloadUrl(fileKey: string) {
  if (import.meta.env.DEV) {
    return `/api/basic/file/download?fileKey=${encodeURIComponent(fileKey)}`
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
  return `${baseUrl}/basic/file/download?fileKey=${encodeURIComponent(fileKey)}`
}

function parseFileName(contentDisposition: string | null, fallback: string) {
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

export async function downloadFile(fileKey: string, fallbackName = fileKey) {
  const token = getToken()
  const response = await fetch(resolveDownloadUrl(fileKey), {
    method: 'GET',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  })

  if (!response.ok) {
    throw new Error(`下载失败: ${response.status}`)
  }

  return {
    blob: await response.blob(),
    fileName: parseFileName(response.headers.get('content-disposition'), fallbackName),
  }
}
