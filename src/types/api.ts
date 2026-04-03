export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T> {
  current: number
  size: number
  total: number
  pages?: number
  records: T[]
}
