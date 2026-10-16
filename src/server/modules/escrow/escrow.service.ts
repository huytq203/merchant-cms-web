import "server-only";

import { z } from "zod";
import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import { escrowContributionSchema, escrowLedgerEntrySchema, escrowStandingSchema } from "@/features/escrow/schemas";
import type { EscrowContribution, EscrowLedgerEntry, EscrowStanding } from "@/features/escrow/types";

// Merchant Portal endpoints, read-only. Only a session assigned at Master level may read them;
// a Sub-level session gets 404. The ledger is ordered by seq desc and ignores `sort`.
const escrowPath = (masterId: string) => `/api/v1/merchant/escrow/${encodeURIComponent(masterId)}`;

export function getEscrowStanding(masterId: string): Promise<BeResult<EscrowStanding>> {
  return merchantClient().get({ path: escrowPath(masterId), schema: escrowStandingSchema });
}

export function listEscrowContributions(masterId: string): Promise<BeResult<EscrowContribution[]>> {
  return merchantClient().get({ path: `${escrowPath(masterId)}/contributions`, schema: z.array(escrowContributionSchema) });
}

export async function listEscrowLedger(masterId: string, page: number, pageSize: number): Promise<BeResult<{ rows: EscrowLedgerEntry[]; total: number }>> {
  const result = await merchantClient().get({
    path: `${escrowPath(masterId)}/ledger`,
    schema: pageSchema(escrowLedgerEntrySchema),
    query: { page, size: pageSize },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}
