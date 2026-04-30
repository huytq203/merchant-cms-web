"server-only";

import { prisma } from "@/lib/db/prisma";
import type { Prisma, SubMerchantStatus } from "@prisma/client";
import { toSubMerchantResponse, type SubMerchantResponse } from "./sub-merchant.entity";

export interface FindAllSubMerchantParams {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function findAllSubMerchants(params: FindAllSubMerchantParams): Promise<{
  data: SubMerchantResponse[];
  pagination: { page: number; pageSize: number; total: number };
}> {
  const { keyword = "", status = "", page = 1, pageSize = 10 } = params;

  const where: Prisma.SubMerchantWhereInput = {
    ...(keyword && { name: { contains: keyword } }),
    ...(status && { status: status as SubMerchantStatus }),
  };

  const [total, rows] = await Promise.all([
    prisma.subMerchant.count({ where }),
    prisma.subMerchant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { data: rows.map(toSubMerchantResponse), pagination: { page, pageSize, total } };
}

export async function findSubMerchantById(id: string): Promise<SubMerchantResponse | null> {
  const sm = await prisma.subMerchant.findUnique({ where: { id } });
  return sm ? toSubMerchantResponse(sm) : null;
}

type BoolField = boolean | undefined;

export async function insertSubMerchant(data: {
  id: string;
  name: string;
  businessType: string;
  contact: string;
  taxCode?: string | null;
  representative?: string | null;
  address?: string | null;
  merchantId: string;
  accessKey?: string | null;
  secretKey?: string | null;
  webhookUrl?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  notifyEnabled?: BoolField;
  notifyTxSuccess?: BoolField;
  notifyTxFailed?: BoolField;
  notifyDispute?: BoolField;
  notifyFreeze?: BoolField;
  notifyPolicyChange?: BoolField;
  notifyEmails?: string | null;
  eInvoiceEnabled?: BoolField;
  eInvoiceEmails?: string | null;
  now: Date;
}): Promise<void> {
  await prisma.subMerchant.create({
    data: {
      id: data.id,
      name: data.name,
      businessType: data.businessType,
      contact: data.contact,
      status: "active",
      taxCode: data.taxCode ?? null,
      representative: data.representative ?? null,
      address: data.address ?? null,
      merchantId: data.merchantId,
      accessKey: data.accessKey ?? null,
      secretKey: data.secretKey ?? null,
      webhookUrl: data.webhookUrl ?? null,
      bankName: data.bankName ?? null,
      bankBranch: data.bankBranch ?? null,
      accountNumber: data.accountNumber ?? null,
      accountName: data.accountName ?? null,
      notifyEnabled: data.notifyEnabled ?? false,
      notifyTxSuccess: data.notifyTxSuccess ?? false,
      notifyTxFailed: data.notifyTxFailed ?? false,
      notifyDispute: data.notifyDispute ?? false,
      notifyFreeze: data.notifyFreeze ?? false,
      notifyPolicyChange: data.notifyPolicyChange ?? false,
      notifyEmails: data.notifyEmails ?? null,
      eInvoiceEnabled: data.eInvoiceEnabled ?? false,
      eInvoiceEmails: data.eInvoiceEmails ?? null,
      createdAt: data.now,
      updatedAt: data.now,
    },
  });
}

export type UpdateSubMerchantData = Partial<Omit<SubMerchantResponse, "id" | "createdAt">>;

export async function updateSubMerchant(id: string, data: UpdateSubMerchantData): Promise<void> {
  await prisma.subMerchant.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.businessType !== undefined && { businessType: data.businessType }),
      ...(data.contact !== undefined && { contact: data.contact }),
      ...(data.taxCode !== undefined && { taxCode: data.taxCode || null }),
      ...(data.representative !== undefined && { representative: data.representative || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.merchantId !== undefined && { merchantId: data.merchantId || null }),
      ...(data.accessKey !== undefined && { accessKey: data.accessKey || null }),
      ...(data.secretKey !== undefined && { secretKey: data.secretKey || null }),
      ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl || null }),
      ...(data.bankName !== undefined && { bankName: data.bankName || null }),
      ...(data.bankBranch !== undefined && { bankBranch: data.bankBranch || null }),
      ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber || null }),
      ...(data.accountName !== undefined && { accountName: data.accountName || null }),
      ...(data.notifyEnabled !== undefined && { notifyEnabled: data.notifyEnabled }),
      ...(data.notifyTxSuccess !== undefined && { notifyTxSuccess: data.notifyTxSuccess }),
      ...(data.notifyTxFailed !== undefined && { notifyTxFailed: data.notifyTxFailed }),
      ...(data.notifyDispute !== undefined && { notifyDispute: data.notifyDispute }),
      ...(data.notifyFreeze !== undefined && { notifyFreeze: data.notifyFreeze }),
      ...(data.notifyPolicyChange !== undefined && { notifyPolicyChange: data.notifyPolicyChange }),
      ...(data.notifyEmails !== undefined && { notifyEmails: data.notifyEmails || null }),
      ...(data.eInvoiceEnabled !== undefined && { eInvoiceEnabled: data.eInvoiceEnabled }),
      ...(data.eInvoiceEmails !== undefined && { eInvoiceEmails: data.eInvoiceEmails || null }),
      updatedAt: new Date(),
    },
  });
}

export async function patchSubMerchantStatus(
  id: string,
  status: string,
  lockReason: string | null,
  lockedAt: string | null,
): Promise<void> {
  await prisma.subMerchant.update({
    where: { id },
    data: {
      status: status as SubMerchantStatus,
      lockReason,
      lockedAt: lockedAt ? new Date(lockedAt) : null,
      updatedAt: new Date(),
    },
  });
}

export async function deleteSubMerchant(id: string): Promise<void> {
  await prisma.subMerchant.delete({ where: { id } });
}

export async function subMerchantExists(id: string): Promise<boolean> {
  const count = await prisma.subMerchant.count({ where: { id } });
  return count > 0;
}
