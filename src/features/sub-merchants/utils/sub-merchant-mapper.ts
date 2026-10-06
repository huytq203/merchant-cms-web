import type { z } from "zod";

import { subMerchantDetailSchema, subMerchantSummarySchema } from "../schemas";
import type { SubMerchantFormValues, subMerchantStatusSchema, lockSourceSchema } from "../schemas";
import type { SubMerchantDetail, SubMerchantRow } from "../types";

type Status = z.infer<typeof subMerchantStatusSchema>;
type Source = z.infer<typeof lockSourceSchema>;
type LockState = { status: Status; lockSource?: Source | null };

export function toSubMerchantRow(dto: unknown): SubMerchantRow {
  return subMerchantSummarySchema.parse(dto);
}

export function toSubMerchantDetail(dto: unknown): SubMerchantDetail {
  return subMerchantDetailSchema.parse(dto);
}

function optionalText(value: string): string | undefined {
  return value === "" ? undefined : value;
}

function contactFields(values: SubMerchantFormValues) {
  return {
    inheritPhone: values.inheritPhone,
    ...(values.inheritPhone ? {} : { phone: values.phone }),
    inheritAddress: values.inheritAddress,
    ...(values.inheritAddress ? {} : { address: values.address }),
  };
}

export function toCreateRequest(values: SubMerchantFormValues, merchantId: string) {
  return { merchantId, name: values.name.trim(), businessField: optionalText(values.businessField), ...contactFields(values) };
}

export function toUpdateRequest(values: SubMerchantFormValues) {
  return { name: values.name.trim(), businessField: optionalText(values.businessField), ...contactFields(values) };
}

export const canLock = (node: LockState): boolean => node.status === "ACTIVE";

export const canUnlock = (node: LockState): boolean =>
  node.status === "INACTIVE" && node.lockSource === "DIRECT";
