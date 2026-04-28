"server-only";

import { dbQuery } from "@/lib/db/db";
import type { RowDataPacket } from "mysql2/promise";

export interface RecentTransaction {
  id: string;
  code: string;
  customerName: string;
  amount: number;
  createdAt: string;
  status: string;
  cardType: string;
  cardNumber: string;
  bankCode: string;
}

export interface ChartDataPoint {
  label: string;
  revenue: number;
  transactions: number;
}

export interface ChartSummary {
  totalRevenue: number;
  totalTransactions: number;
  growthRate: number;
}

export interface FindDashboardParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function findRecentTransactions(params: FindDashboardParams): Promise<{
  data: RecentTransaction[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", status = "", page = 1, pageSize = 10 } = params;
  const conditions: string[] = [];
  const args: (string | number | null)[] = [];

  if (keyword) {
    conditions.push("(code LIKE ? OR customer_name LIKE ?)");
    args.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) { conditions.push("status = ?"); args.push(status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await dbQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM dashboard_recent_transactions ${where}`,
    args,
  );
  const total = Number(countRows[0]!.total);
  const offset = (page - 1) * pageSize;

  const rows = await dbQuery<RowDataPacket[]>(
    `SELECT id, code, customer_name AS customerName, amount,
            created_at AS createdAt, status,
            card_type AS cardType, card_number AS cardNumber,
            bank_code AS bankCode
     FROM dashboard_recent_transactions
     ${where}
     ORDER BY created_at DESC
     LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
    args,
  );

  return { data: rows as RecentTransaction[], pagination: { page, pageSize, total } };
}

export async function findChartData(
  period: string,
): Promise<{ points: ChartDataPoint[]; summary: ChartSummary }> {
  const rows = await dbQuery<RowDataPacket[]>(
    `SELECT label, revenue, transactions,
            total_revenue, total_transactions, growth_rate
     FROM chart_data
     WHERE period_type = ?
     ORDER BY id ASC`,
    [period],
  );

  const points = rows.map((r) => ({
    label: r.label as string,
    revenue: Number(r.revenue),
    transactions: Number(r.transactions),
  }));

  const first = rows[0];
  const summary: ChartSummary = first
    ? {
        totalRevenue: Number(first.total_revenue),
        totalTransactions: Number(first.total_transactions),
        growthRate: Number(first.growth_rate),
      }
    : { totalRevenue: 0, totalTransactions: 0, growthRate: 0 };

  return { points, summary };
}
