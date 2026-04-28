"server-only";

import type { RowDataPacket } from "mysql2/promise";

/** Khớp với bảng `users` trong DB (snake_case). */
export interface UserEntity {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  permission_group_id: string | null;
  permission_group_name: string | null;
  sub_merchant_scope: "all" | "specific";
  status: "active" | "locked";
  lock_reason: string | null;
  locked_at: Date | null;
  created_at: Date;
  updated_at: Date;
  /** Được JOIN từ bảng permission_groups */
  permission_group_name_join?: string | null;
}

/** Định dạng trả về cho client (camelCase). */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  permissionGroupId: string | null;
  permissionGroupName: string | null;
  subMerchantScope: "all" | "specific";
  assignedSubMerchantsIds: string[];
  assignedSubMerchantCount: number;
  status: "active" | "locked";
  lockReason: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toUserResponse(
  row: RowDataPacket,
  assignedSubMerchantsIds: string[],
): UserResponse {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string | null) ?? null,
    permissionGroupId: (row.permission_group_id as string | null) ?? null,
    permissionGroupName: (row.permission_group_name as string | null) ?? null,
    subMerchantScope: row.sub_merchant_scope as "all" | "specific",
    assignedSubMerchantsIds,
    assignedSubMerchantCount: assignedSubMerchantsIds.length,
    status: row.status as "active" | "locked",
    lockReason: (row.lock_reason as string | null) ?? null,
    lockedAt: row.locked_at ? String(row.locked_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
