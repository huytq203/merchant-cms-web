"server-only";
import { prisma } from "@/lib/db/prisma";
import type { ComplaintStatus, ComplaintSource } from "@prisma/client";
import { toComplaintResponse, type ComplaintResponse } from "./complaint.entity";

export interface FindComplaintParams {
  keyword?: string;
  status?: string;
  source?: string;
  createdFromDate?: string;
  createdToDate?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllComplaints(params: FindComplaintParams): Promise<{
  data: ComplaintResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", status, source, createdFromDate, createdToDate, page = 1, pageSize = 10 } = params;

  const where = {
    ...(keyword && {
      OR: [
        { ticketCode: { contains: keyword } },
        { transactionCode: { contains: keyword } },
      ],
    }),
    ...(status && { status: status as ComplaintStatus }),
    ...(source && { source: source as ComplaintSource }),
    ...((createdFromDate || createdToDate) && {
      createdAt: {
        ...(createdFromDate && { gte: new Date(createdFromDate) }),
        ...(createdToDate && { lte: new Date(createdToDate) }),
      },
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);

  return { data: rows.map(toComplaintResponse), pagination: { page, pageSize, total } };
}
