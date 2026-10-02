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

// ─── Chart types ──────────────────────────────────────────────────────────────

export type ChartPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RevenueDataPoint {
  label: string;
  revenue: number;       // đơn vị: VND
  transactions: number;
}

export interface RevenueSummary {
  totalRevenue: number;        // đơn vị: VND
  totalTransactions: number;
  growthRate: number;          // phần trăm, dương = tăng
}

export interface RevenueChartResponse {
  points: RevenueDataPoint[];
  summary: RevenueSummary;
}

export interface ChartParams {
  period: ChartPeriod;
  year?: number;
   [key: string]: string | number | boolean | null | undefined
}