import "server-only";

import { z } from "zod";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { subBalanceReportSchema } from "@/features/sub-balances/schemas";
import type { SubBalanceReport } from "@/features/sub-balances/types";
import { pageSchema } from "@/lib/be/envelope";
import { ok } from "@/lib/http/result";
import { movementDetailSchema, movementSchema } from "@/features/sub-balances/movement-schemas";
import type { MovementDetail, MovementExportFilter, MovementFilter, MovementListResult, MovementPocket } from "@/features/sub-balances/movement-types";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";
import { classifyFetchError, toBeError } from "@/lib/be/errors";
import { fail } from "@/lib/http/result";

// Merchant Portal endpoint: the BE reads the ledger on every call and answers 503 when it cannot,
// and 404 for a Sub outside the session scope.
const SUB_BALANCES = "/api/v1/merchant/sub-balances";

export function getSubBalance(subMerchantId: string): Promise<BeResult<SubBalanceReport>> {
  return merchantClient().get({ path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}`, schema: subBalanceReportSchema });
}

/** The page plus the period totals the BE sends next to it (10/11/2026); all optional so an older BE still parses. */
const movementPageSchema = pageSchema(movementSchema).extend({
  openingBalance: z.number().nullish(),
  totalIn: z.number().nullish(),
  totalOut: z.number().nullish(),
  closingBalance: z.number().nullish(),
  totalsComplete: z.boolean().nullish(),
});

/** The ledger movements of the Sub's available balance, paged. BE page is 1-based; the order is newest first. */
export async function listSubBalanceMovements(subMerchantId: string, filter: MovementFilter): Promise<BeResult<MovementListResult>> {
  const result = await merchantClient().get({
    path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}/movements`,
    schema: movementPageSchema,
    query: { type: filter.type, pocket: filter.pocket, fromDate: filter.fromDate, toDate: filter.toDate, page: filter.page, size: filter.size },
  });
  if (!result.success) return result;
  const page = result.data;
  // Without opening and closing balance there is nothing truthful to show: no strip rather than zeros.
  const summary = page.openingBalance == null || page.closingBalance == null ? null : {
    openingBalance: page.openingBalance,
    totalIn: page.totalIn ?? null,
    totalOut: page.totalOut ?? null,
    closingBalance: page.closingBalance,
    totalsComplete: page.totalsComplete ?? (page.totalIn != null && page.totalOut != null),
  };
  return ok({ rows: page.content, total: page.totalElements, summary });
}

/** One movement with its breakdown lines; the BE answers 404 for an operation that is not this Sub's. */
export function getSubBalanceMovement(subMerchantId: string, operationId: string, pocket?: MovementPocket): Promise<BeResult<MovementDetail>> {
  return merchantClient().get({
    path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}/movements/${encodeURIComponent(operationId)}`,
    schema: movementDetailSchema,
    // Same pocket as the list the row was clicked in, so the amount and balance match the row.
    query: { pocket },
  });
}

export type CsvFile = { body: ArrayBuffer; contentType: string; contentDisposition: string | null };

/**
 * CSV biến động của một Sub (quyền `EXPORT_BALANCE`, khoảng ngày ≤ 93 ngày, ≤ 10.000 dòng do BE kiểm). Byte CSV (BOM, CRLF) và hai
 * header `Content-Type`/`Content-Disposition` của BE được giữ nguyên, không đọc lại nội dung; lỗi (400, 6334, 503) là BeResult thất bại.
 * BE đọc sổ cái nhiều lần cho file lớn nên hạn riêng dài hơn đọc JSON.
 */
export async function exportSubBalanceMovements(subMerchantId: string, filter: MovementExportFilter): Promise<BeResult<CsvFile>> {
  const token = await readAccessToken();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) query.set(key, String(value));
  let response: Response;
  try {
    response = await fetch(`${getServerEnv().MERCHANT_BASE_URL}${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}/movements/export?${query}`, {
      headers: { Accept: "text/csv, application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    const failure = classifyFetchError(error);
    return fail(failure, failure.code);
  }
  if (!response.ok) {
    const failure = toBeError(response.status, await response.json().catch(() => undefined));
    return fail(failure, failure.code);
  }
  return ok({
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "text/csv; charset=utf-8",
    contentDisposition: response.headers.get("content-disposition"),
  });
}
