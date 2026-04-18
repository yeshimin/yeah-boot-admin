import { request } from '@/utils/request'

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
