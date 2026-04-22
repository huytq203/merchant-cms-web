import { Transaction } from "@/features/transactions/types"

export interface ParamsGetAll {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  salesStaffId?: string
  total?:number
  [key: string]: string | number | boolean | null | undefined
}
export interface DashboardResponse {
  data: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}