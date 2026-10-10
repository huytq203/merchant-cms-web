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
    // A session limited to Subs has no Master of its own. Its parent Master is not reachable for it,
    // so it must not be offered as the merchant context (the BE answers 404 for it).
    merchantIds: me.merchantIds,
    merchants: me.merchants,
    subMerchantIds: me.subMerchantIds,
    permissions: me.permissions.filter(isMerchantPermission),
    authorizationVersion: me.authorizationVersion,
  };
}
