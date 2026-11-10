import { NextResponse } from "next/server";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { requirePermission } from "@/server/auth/require-permission";
import { listSubMerchantChoiceRows } from "@/server/modules/sub-merchants/sub-merchant.service";

/**
 * The Subs a Sub picker may offer (Terminal, Order, User, Bank account, Complaint and finance screens). Reads the
 * BE `/choices` endpoint, which is scoped to the session and gated by the same any-of permissions as
 * PERMISSION_GATES.subMerchantChoices, so a viewer or a Sub-only user gets the names instead of the 403 the
 * management list (MANAGE_SUB_MERCHANT and a Master id) gave them. No Master id is required here.
 */
export async function GET() {
  const access = await requirePermission(PERMISSION_GATES.subMerchantChoices);
  if (!access.ok) return access.response;
  const result = await listSubMerchantChoiceRows();
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
