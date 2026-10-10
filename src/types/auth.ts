import type { MerchantPermission } from "@/features/auth/permissions";

export type UserRole = "ACCOUNTANT" | "OPERATOR" | "SUPER_ADMIN" | string;

export type MerchantUserStatus = "PENDING" | "ACTIVE" | "LOCKED";

/** A Master of the session, named so a screen can show it instead of an id. */
export interface SessionMerchant {
  id: string;
  code?: string | null;
  name?: string | null;
}

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
  merchants: SessionMerchant[];
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
  iss?: string;
  azp?: string;
  typ?: string;
  aud?: string | string[];
  roles?: string[];
  realm_access?: { roles?: string[] };
  sub?: string;
}
