import { request } from '@/utils/request'
import { downloadByUrl, resolveApiUrl } from '@/utils/download'
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
  const path = payload.path?.trim()

  formData.append('file', payload.file)
  formData.append('storageType', payload.storageType || '1')
  formData.append('isPublic', payload.isPublic || 'true')
  formData.append('isUsed', payload.isUsed || 'false')
  if (path) {
    formData.append('path', path)
  }

  return request<UploadStorageResponse>({
    url: '/basic/storage/upload',
    method: 'post',
    data: formData,
  })
}

export function getStoragePreviewUrl(fileKey: string) {
  return resolveApiUrl(`/public/storage/preview?fileKey=${encodeURIComponent(fileKey)}`)
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

export interface DeleteStorageFilesRequest {
  fileKeys?: string[]
  ids?: number[]
}

export function deleteStorageFile(fileKey: string) {
  return deleteStorageFiles([fileKey])
}

export function deleteStorageFiles(payload: string[] | DeleteStorageFilesRequest) {
  const data = Array.isArray(payload) ? { fileKeys: payload } : payload

  return request<void>({
    url: '/basic/storage/delete',
    method: 'post',
    data,
  })
}

function resolveStorageDownloadUrl(fileKey: string) {
  return resolveApiUrl(`/basic/storage/download?fileKey=${encodeURIComponent(fileKey)}`)
}

export async function downloadStorageFile(fileKey: string, fallbackName = fileKey) {
  return downloadByUrl(resolveStorageDownloadUrl(fileKey), fallbackName)
}
