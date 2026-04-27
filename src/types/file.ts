export interface ManagedFileRecord {
  id: number
  fileKey: string
  originalName: string
  storageType?: number
  basePath?: string
  bucket?: string
  path?: string
  suffix?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
}

export interface FileUploadFormModel {
  storageType: string
}
