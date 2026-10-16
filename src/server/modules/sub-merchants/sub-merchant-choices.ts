import "server-only";

import { hasPermission } from "@/features/auth/permissions";
import type { SubMerchantChoice } from "@/features/sub-merchants/utils/sub-merchant-choice";
import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import type { SessionUser } from "@/types/auth";
import { listSubMerchants } from "./sub-merchant.service";

/**
 * Subs a finance screen may show. The named list needs MANAGE_SUB_MERCHANT on the BE; without it the
 * session only knows the ids it was assigned, so those are offered by position until the BE names them.
 */
export async function listSubMerchantChoices(user: SessionUser): Promise<BeResult<SubMerchantChoice[]>> {
  if (!hasPermission(user.permissions, "MANAGE_SUB_MERCHANT")) {
    return ok(user.subMerchantIds.map((id, index) => ({ id, label: `Sub-merchant ${index + 1}` })));
  }
  const result = await listSubMerchants({ page: 1, pageSize: 100 });
  if (!result.success) return result;
  return ok(result.data.rows.map((row) => ({ id: row.id, label: `${row.code} · ${row.name}` })));
}
