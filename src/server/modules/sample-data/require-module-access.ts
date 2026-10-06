import "server-only";

import { NextResponse } from "next/server";
import type { MerchantPermission } from "@/features/auth/permissions";
import { requirePermission } from "@/server/auth/require-permission";
import { toModuleHttpStatus } from "@/lib/be/api-mode";
import type { BeError } from "@/lib/be/errors";

type ModuleAccess = { ok: true; merchantId: string } | { ok: false; response: NextResponse };

/**
 * Guard shared by the modules that have no BE API yet (transactions, refund, complaints, dashboard).
 * 401 without a session, 403 without the permission; the merchant always comes from the session.
 * Pass no permission when the session alone is enough (dashboard).
 */
export async function requireModuleAccess(permission?: MerchantPermission): Promise<ModuleAccess> {
  const access = await requirePermission(permission, { requireMerchant: true });
  if (!access.ok) return access;
  const [merchantId = ""] = access.user.merchantIds;
  return { ok: true, merchantId };
}

/** A BE failure as a route response; never 401 (it would log the user out), 501 stays 501. */
export function moduleErrorResponse(error: BeError): NextResponse {
  return NextResponse.json({ message: error.message }, { status: toModuleHttpStatus(error) });
}
