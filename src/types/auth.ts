import type { MerchantPermission } from "@/features/auth/permissions";

export type UserRole = "ACCOUNTANT" | "OPERATOR" | "SUPER_ADMIN" | string;

export type MerchantUserStatus = "PENDING" | "ACTIVE" | "LOCKED";

export interface SessionUser {
  /** BE `merchantUserId`. */
  userId: string;
  /** Display name: full name, falling back to email, then id. */
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status: MerchantUserStatus;
  merchantIds: string[];
  subMerchantIds: string[];
  permissions: MerchantPermission[];
  authorizationVersion: number;
  /** Legacy fields kept optional until the Đợt 2 account/user plans remove their consumers. */
  permissionGroupId?: string;
  permissionName?: string;
  subMerchantScope?: string;
  assignedSubMerchantsIds?: string[];
  createdAt?: string;
}

/** Claims the frontend reads from the access token (never used to authenticate). */
export interface JwtPayload {
  exp: number;
  iat?: number;
  sub?: string;
}

