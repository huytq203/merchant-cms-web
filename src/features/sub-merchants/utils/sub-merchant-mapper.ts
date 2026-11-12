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

function optionalText(value: string | undefined): string | undefined {
  return !value ? undefined : value;
}

function contactFields(values: SubMerchantFormValues) {
  return {
    inheritPhone: values.inheritPhone,
    ...(values.inheritPhone ? {} : { phone: values.phone }),
    inheritAddress: values.inheritAddress,
    ...(values.inheritAddress ? {} : { address: values.address }),
  };
}

/**
 * Ngành nghề và hợp đồng riêng của Sub. Không gửi `businessField`: khi có `mccCode` BE tự đặt tên ngành chuẩn và bỏ qua
 * giá trị gửi lên. Rỗng thì bỏ khỏi body (tạo mới ⇒ BE lấy ngành của Master; sửa ⇒ giữ nguyên).
 */
function categoryAndContractFields(values: SubMerchantFormValues) {
  return { mccCode: optionalText(values.mccCode), contractStagingId: optionalText(values.contractStagingId) };
}

export function toCreateRequest(values: SubMerchantFormValues, merchantId: string) {
  return { merchantId, name: values.name.trim(), ...categoryAndContractFields(values), ...contactFields(values) };
}

export function toUpdateRequest(values: SubMerchantFormValues) {
  return { name: values.name.trim(), ...categoryAndContractFields(values), ...contactFields(values) };
}

export const canLock = (node: LockState): boolean => node.status === "ACTIVE";

export const canUnlock = (node: LockState): boolean =>
  node.status === "INACTIVE" && node.lockSource === "DIRECT";
