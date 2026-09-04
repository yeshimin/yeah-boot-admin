export interface ManagedStorageRecord {
  id: number
  fileKey: string
  originalName: string
  suffix?: string
  storageType?: number
  path?: string
  isPublic?: boolean
  isUsed?: boolean
  bucket?: string
  basePath?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
  cleanableTime?: string
}

export interface StorageUploadFormModel {
  storageType: number
  isPublic: boolean
  isUsed: boolean
  path: string
}
