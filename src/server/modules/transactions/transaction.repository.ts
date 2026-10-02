"server-only";

import { prisma } from "@/lib/db/prisma";
import type { TransactionStatus } from "@prisma/client";
import { toTransactionResponse, type TransactionResponse } from "./transaction.entity";

export interface FindTransactionParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  paymentMethod?: string;
  createdFromDate?: string;
  createdToDate?: string;
  subMerchantId?: string;
  bankCode?: string;
}

export async function findAllTransactions(params: FindTransactionParams): Promise<{
  data: TransactionResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { 
    paymentMethod, 
    keyword = "", 
    status = "", 
    page = 1, 
    pageSize = 10, 
    createdFromDate, 
    createdToDate, 
    subMerchantId, 
    bankCode } = params;

  const where = {
    ...(keyword && {
      OR: [
        { code: { contains: keyword } },
        { customerName: { contains: keyword } },
      ],
    }),
    ...(status && { status: status as TransactionStatus }),
    ...(paymentMethod && { paymentMethod }),
    ...((createdFromDate || createdToDate) && {
      createdAt: {
        ...(createdFromDate && { gte: new Date(createdFromDate) }),
        ...(createdToDate && { lte: new Date(createdToDate) }),
      },
    }),
    ...(subMerchantId && { subMerchantId:subMerchantId }),
    ...(bankCode && { bankCode:bankCode }), 
  };

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

 

  return { data:rows.map(toTransactionResponse), pagination: { page, pageSize, total } };
}
