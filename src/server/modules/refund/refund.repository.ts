"server-only";
import { prisma } from "@/lib/db/prisma";
import type { RefundStatus } from "@prisma/client";
import { toRefundResponse, type RefundResponse } from "./refund.entity";

export interface FindRefundParams {
  keyword?: string;
  invoiceCode?: string;
  transactionCode?: string;
  subMerchantId?: string;
  status?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllRefunds(params: FindRefundParams): Promise<{
  data: RefundResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword, invoiceCode, transactionCode, subMerchantId, status, createdFromDate, createdToDate, page = 1, pageSize = 10 } = params;

  const where = {
    ...(keyword && {
      OR: [
        { code: { contains: keyword } },
        { transactionCode: { contains: keyword } },
      ],
    }),
    ...(transactionCode && { transactionCode: { contains: transactionCode } }),
    ...(invoiceCode && { invoiceCode: { contains: invoiceCode } }),
    ...(subMerchantId && { subMerchantId }),
    ...(status && { status: status as RefundStatus }),
    ...((createdFromDate || createdToDate) && {
      createdAt: {
        ...(createdFromDate && { gte: new Date(createdFromDate) }),
        ...(createdToDate && { lte: new Date(createdToDate) }),
      },
    }),
  };
  
  const [total, rows] = await Promise.all([
    prisma.refund.count({ where }),
    prisma.refund.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);

  return { data: rows.map(toRefundResponse), pagination: { page, pageSize, total } };
}
