"server-only";
import { prisma } from "@/lib/db/prisma";
import type { OrderStatus, OrderSource } from "@prisma/client";
import { toOrderResponse, type OrderResponse } from "./order.entity";

export interface FindOrderParams {
  keyword?: string;
  source?: string;
  subMerchantId?: string;
  createdBy?: string;
  status?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllOrders(params: FindOrderParams): Promise<{
  data: OrderResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", source, subMerchantId, createdBy, status, createdFromDate, createdToDate, page = 1, pageSize = 10 } = params;

  const where = {
    ...(keyword && {
      OR: [
        { code: { contains: keyword } },
        { transactionCode: { contains: keyword } },
      ],
    }),
    ...(source && { source: source as OrderSource }),
    ...(subMerchantId && { subMerchantId }),
    ...(createdBy && { createdBy: { contains: createdBy } }),
    ...(status && { status: status as OrderStatus }),
    ...((createdFromDate || createdToDate) && {
      createdAt: {
        ...(createdFromDate && { gte: new Date(createdFromDate) }),
        ...(createdToDate && { lte: new Date(createdToDate) }),
      },
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);

  return { data: rows.map(toOrderResponse), pagination: { page, pageSize, total } };
}
