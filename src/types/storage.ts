export interface ManagedStorageRecord {
  id: number
  fileKey: string
  originalName: string
  suffix?: string
  storageType?: number
  path?: string
  isPublic?: boolean | string
  isUsed?: boolean | string
  bucket?: string
  basePath?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
  cleanableTime?: string
}

export interface StorageUploadFormModel {
  storageType: string
  isPublic: string
  isUsed: string
  path: string
}
