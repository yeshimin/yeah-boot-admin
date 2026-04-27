import { request } from '@/utils/request'
import { getToken } from '@/utils/auth'
import type { PageResponse } from '@/types/api'

export interface UploadStorageRequest {
  file: File
  storageType?: string
  isPublic?: string
  isUsed?: string
  path?: string
}

export interface UploadStorageResponse {
  fileKey: string
}

export function uploadStorageFile(payload: UploadStorageRequest) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('storageType', payload.storageType || '1')
  formData.append('isPublic', payload.isPublic || 'true')
  formData.append('isUsed', payload.isUsed || 'false')
  formData.append('path', payload.path || 'tempdir0129')

  return request<UploadStorageResponse>({
    url: '/basic/storage/upload',
    method: 'post',
    data: formData,
  })
}

export function getStoragePreviewUrl(fileKey: string) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
  return `${baseUrl}/public/storage/preview?fileKey=${encodeURIComponent(fileKey)}`
}

export function queryStorageFiles(params: Record<string, unknown>) {
  return request<PageResponse<Record<string, unknown>>>({
    url: '/basic/storage/crud/query',
    method: 'get',
    params,
  })
}

export function getStorageDetail(id: number) {
  return request<Record<string, unknown>>({
    url: '/basic/storage/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function deleteStorageFile(fileKey: string) {
  return request<void>({
    url: '/basic/storage/delete',
    method: 'post',
    params: { fileKey },
  })
}

function resolveStorageDownloadUrl(fileKey: string) {
  if (import.meta.env.DEV) {
    return `/api/basic/storage/download?fileKey=${encodeURIComponent(fileKey)}`
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
  return `${baseUrl}/basic/storage/download?fileKey=${encodeURIComponent(fileKey)}`
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

export async function downloadStorageFile(fileKey: string, fallbackName = fileKey) {
  const token = getToken()
  const response = await fetch(resolveStorageDownloadUrl(fileKey), {
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
