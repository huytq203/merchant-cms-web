import { isMerchantPermission } from "@/features/auth/permissions";
import type { MeResponse } from "@/features/auth/schemas";
import type { SessionUser } from "@/types/auth";

export function toSessionUser(me: MeResponse): SessionUser {
  const fullName = me.fullName?.trim() || undefined;
  const email = me.email ?? undefined;
  return {
    userId: me.merchantUserId,
    username: fullName ?? email ?? me.merchantUserId,
    fullName,
    email,
    status: me.status,
    merchantIds: me.merchantIds,
    subMerchantIds: me.subMerchantIds,
    permissions: me.permissions.filter(isMerchantPermission),
    authorizationVersion: me.authorizationVersion,
  };
}
