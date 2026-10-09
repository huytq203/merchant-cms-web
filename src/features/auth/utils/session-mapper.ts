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
    // A session limited to Subs has no Master of its own; the Master its Subs sit under is the context
    // the screens open in. The BE still decides what the session may actually reach.
    merchantIds: me.merchantIds.length > 0 ? me.merchantIds : me.parentMerchantIds,
    subMerchantIds: me.subMerchantIds,
    permissions: me.permissions.filter(isMerchantPermission),
    authorizationVersion: me.authorizationVersion,
  };
}
