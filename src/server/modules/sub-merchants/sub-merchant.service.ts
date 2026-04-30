"server-only";

import type { SubMerchantResponse } from "./sub-merchant.entity";
import {
  findAllSubMerchants,
  findSubMerchantById,
  insertSubMerchant,
  updateSubMerchant,
  patchSubMerchantStatus,
  deleteSubMerchant,
  subMerchantExists,
  type FindAllSubMerchantParams,
  type UpdateSubMerchantData,
} from "./sub-merchant.repository";

export interface PaginatedSubMerchants {
  data: SubMerchantResponse[];
  pagination: { page: number; pageSize: number; total: number };
}

export async function getSubMerchantList(
  params: FindAllSubMerchantParams,
): Promise<PaginatedSubMerchants> {
  return findAllSubMerchants(params);
}

export async function getSubMerchantById(id: string): Promise<SubMerchantResponse | null> {
  return findSubMerchantById(id);
}

export async function createSubMerchant(
  input: Omit<Parameters<typeof insertSubMerchant>[0], "id" | "now">,
): Promise<SubMerchantResponse> {
  const now = new Date();
  const id = `SUB-${Date.now()}`;
  const merchantId = input.merchantId || `MCH-${Date.now()}`;

  await insertSubMerchant({ ...input, id, merchantId, now });
  return findSubMerchantById(id) as Promise<SubMerchantResponse>;
}

export async function updateSubMerchantById(
  id: string,
  data: UpdateSubMerchantData,
): Promise<SubMerchantResponse | null> {
  if (!(await subMerchantExists(id))) return null;
  await updateSubMerchant(id, data);
  return findSubMerchantById(id);
}

export async function toggleSubMerchantStatus(
  id: string,
  lockReason: string | null | undefined,
  existingLockReason: string | null | undefined,
): Promise<SubMerchantResponse | null> {
  if (!(await subMerchantExists(id))) return null;

  const resolvedLockReason =
    lockReason !== undefined ? lockReason : (existingLockReason ?? null);
  const status = resolvedLockReason ? "locked" : "active";
  const lockedAt = resolvedLockReason ? new Date().toISOString() : null;

  await patchSubMerchantStatus(id, status, resolvedLockReason, lockedAt);
  return findSubMerchantById(id);
}

export async function removeSubMerchant(id: string): Promise<boolean> {
  if (!(await subMerchantExists(id))) return false;
  await deleteSubMerchant(id);
  return true;
}
