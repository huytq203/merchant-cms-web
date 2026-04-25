export interface PermissionAPI {
  data: PermissionData[]
  pagination: Pagination
}

export interface PermissionData {
  id: string | number
  name: string
  createdAt: string
  status: string
  permissions: string[]
  userCount?: number
  createdBy?: string
  updatedBy?: string
  updatedAt?: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}
