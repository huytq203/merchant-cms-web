import "server-only";

import type { SubMerchantChoice } from "@/features/sub-merchants/utils/sub-merchant-choice";
import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import type { SessionUser } from "@/types/auth";
import { listSubMerchantChoiceRows } from "./sub-merchant.service";

/** Label of a named Sub. */
const nameLabel = (row: { code: string; name: string }) => `${row.code} · ${row.name}`;

/** Positional label used only when the BE cannot name the Subs (endpoint missing or failing). */
const positionalChoices = (ids: readonly string[]): SubMerchantChoice[] => ids.map((id, index) => ({ id, label: `Sub-merchant ${index + 1}` }));

/**
 * Subs a finance screen may show, read from the light `/choices` endpoint for every session. A session that may
 * manage Subs used to read the full list instead (Terminal counts, bank account, 7-day revenue per row), which is
 * heavy and capped at 100 rows; `/choices` returns only the names, up to 500, already bounded by the session scope.
 * If the call fails (for instance a BE that has not shipped the endpoint yet) the screen stays usable with positional
 * labels built from the assigned ids. A session limited to given Subs only ever sees those.
 */
export async function listSubMerchantChoices(user: SessionUser): Promise<BeResult<SubMerchantChoice[]>> {
  const named = await listSubMerchantChoiceRows();
  if (!named.success) return ok(positionalChoices(user.subMerchantIds));
  const limited = user.subMerchantIds.length > 0;
  const rows = limited ? named.data.filter((row) => user.subMerchantIds.includes(row.id)) : named.data;
  return ok(rows.map((row) => ({ id: row.id, label: nameLabel(row) })));
}
