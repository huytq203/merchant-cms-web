import "server-only";

import { hasPermission } from "@/features/auth/permissions";
import type { SubMerchantChoice } from "@/features/sub-merchants/utils/sub-merchant-choice";
import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import type { SessionUser } from "@/types/auth";
import { listSubMerchantChoiceRows, listSubMerchants } from "./sub-merchant.service";

/** Label of a named Sub, shared by the managing and non-managing branches so both read the same. */
const nameLabel = (row: { code: string; name: string }) => `${row.code} · ${row.name}`;

/** Positional label used only when the BE cannot name the Subs (endpoint missing or failing). */
const positionalChoices = (ids: readonly string[]): SubMerchantChoice[] => ids.map((id, index) => ({ id, label: `Sub-merchant ${index + 1}` }));

/**
 * Subs a finance screen may show. A session that may manage Subs reads the full named list. Any other session
 * reads the read-only `/choices` endpoint, which names exactly the Subs it is assigned. If that call fails (for
 * instance a BE that has not shipped the endpoint yet) the screen stays usable with positional labels built from
 * the assigned ids, as before. A session limited to given Subs only ever sees those, whichever branch ran.
 */
export async function listSubMerchantChoices(user: SessionUser): Promise<BeResult<SubMerchantChoice[]>> {
  if (!hasPermission(user.permissions, "MANAGE_SUB_MERCHANT")) {
    const named = await listSubMerchantChoiceRows();
    if (!named.success) return ok(positionalChoices(user.subMerchantIds));
    const limited = user.subMerchantIds.length > 0;
    const rows = limited ? named.data.filter((row) => user.subMerchantIds.includes(row.id)) : named.data;
    return ok(rows.map((row) => ({ id: row.id, label: nameLabel(row) })));
  }
  const result = await listSubMerchants({ page: 1, pageSize: 100 });
  if (!result.success) return result;
  return ok(result.data.rows.map((row) => ({ id: row.id, label: nameLabel(row) })));
}
