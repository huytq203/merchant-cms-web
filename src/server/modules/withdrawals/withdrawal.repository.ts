"server-only";
import { prisma } from "@/lib/db/prisma";
import type { WithdrawalStatus } from "@prisma/client";
import { toWithdrawalResponse, type WithdrawalResponse } from "./withdrawal.entity";

export interface FindWithdrawalParams {
  keyword?: string;
  subMerchantId?: string;
  status?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllWithdrawals(params: FindWithdrawalParams): Promise<{
  data: WithdrawalResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", subMerchantId, status, createdFromDate, createdToDate, page = 1, pageSize = 10 } = params;

  const where = {
    ...(keyword && { code: { contains: keyword } }),
    ...(subMerchantId && { subMerchantId }),
    ...(status && { status: status as WithdrawalStatus }),
    ...((createdFromDate || createdToDate) && {
      createdAt: {
        ...(createdFromDate && { gte: new Date(createdFromDate) }),
        ...(createdToDate && { lte: new Date(createdToDate) }),
      },
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.withdrawal.count({ where }),
    prisma.withdrawal.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);

  return { data: rows.map(toWithdrawalResponse), pagination: { page, pageSize, total } };
}

export async function findWithdrawalById(id: string): Promise<WithdrawalResponse | null> {
  const row = await prisma.withdrawal.findUnique({ where: { id } });
  return row ? toWithdrawalResponse(row) : null;
}
