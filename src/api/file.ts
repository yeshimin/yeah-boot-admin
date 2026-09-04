import { request } from '@/utils/request'
import { downloadByUrl, resolveApiUrl } from '@/utils/download'
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

export function uploadFile(payload: { file: File; storageType: number }) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('storageType', String(payload.storageType))

  return request<Record<string, unknown>>({
    url: '/basic/file/upload',
    method: 'post',
    data: formData,
  })
}

export interface DeleteFilesRequest {
  fileKeys?: string[]
  ids?: number[]
}

export function deleteFile(fileKey: string, options?: { suppressErrorMessage?: boolean }) {
  return deleteFiles([fileKey], options)
}

export function deleteFiles(payload: string[] | DeleteFilesRequest, options?: { suppressErrorMessage?: boolean }) {
  const data = Array.isArray(payload) ? { fileKeys: payload } : payload

  return request<void>({
    url: '/basic/file/delete',
    method: 'post',
    data,
    suppressErrorMessage: options?.suppressErrorMessage,
  })
}

function resolveDownloadUrl(fileKey: string) {
  return resolveApiUrl(`/basic/file/download?fileKey=${encodeURIComponent(fileKey)}`)
}

export async function downloadFile(fileKey: string, fallbackName = fileKey) {
  return downloadByUrl(resolveDownloadUrl(fileKey), fallbackName)
}
