export interface Permission {
  id: string
  name: string
}

export interface PermissionAPI<T = string> {
  data: PermissionData<T>[]
  pagination: Pagination
}

export interface PermissionData<T = string> {
  id: string | number
  name: string
  createdAt: string
  status: string
  permissions: T[]
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
