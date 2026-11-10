import "server-only";

import { z } from "zod";
import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { subMerchantDetailSchema, subMerchantStatusSchema, subMerchantSummarySchema, type SubMerchantFormValues } from "@/features/sub-merchants/schemas";
import type { SubMerchantDetail, SubMerchantListFilter, SubMerchantListResult } from "@/features/sub-merchants/types";
import { hasSubMerchantFilter, matchesSubMerchantFilter } from "@/features/sub-merchants/utils/sub-merchant-filter";
import { toCreateRequest, toUpdateRequest } from "@/features/sub-merchants/utils/sub-merchant-mapper";
import { subMerchantPaths } from "./sub-merchant.paths";

/** Rows fetched per BE call, and the most pages read when filtering. */
const FILTER_FETCH_SIZE = 100;
const FILTER_MAX_PAGES = 10;

/** The filters the BE applies itself (the rest are applied here); they go with every page read so totals stay right. */
type BeFilters = Pick<SubMerchantListFilter, "merchantId" | "hasBankAccount" | "createdFrom" | "createdTo">;

function fetchPage(page: number, size: number, filter: BeFilters) {
  return merchantClient().get({
    path: subMerchantPaths.list,
    schema: pageSchema(subMerchantSummarySchema),
    query: {
      page,
      size,
      merchantId: filter.merchantId,
      hasBankAccount: filter.hasBankAccount,
      createdFrom: filter.createdFrom,
      createdTo: filter.createdTo,
    },
  });
}

/** The merchant endpoint only paginates, so a filtered list reads the assigned outlets and filters them here. */
async function listFiltered(filter: SubMerchantListFilter): Promise<BeResult<SubMerchantListResult>> {
  const first = await fetchPage(1, FILTER_FETCH_SIZE, filter);
  if (!first.success) return first;
  const all = [...first.data.content];
  for (let page = 2; page <= Math.min(first.data.totalPages, FILTER_MAX_PAGES); page += 1) {
    const next = await fetchPage(page, FILTER_FETCH_SIZE, filter);
    if (!next.success) return next;
    all.push(...next.data.content);
  }
  const matched = all.filter((row) => matchesSubMerchantFilter(row, filter));
  const start = (filter.page - 1) * filter.pageSize;
  return ok({ rows: matched.slice(start, start + filter.pageSize), total: matched.length });
}

export async function listSubMerchants(filter: SubMerchantListFilter): Promise<BeResult<SubMerchantListResult>> {
  if (hasSubMerchantFilter(filter)) return listFiltered(filter);
  const result = await fetchPage(filter.page, filter.pageSize, filter);
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

const subMerchantChoiceRowSchema = z.object({ id: z.uuid(), code: z.string(), name: z.string(), status: subMerchantStatusSchema });
export type SubMerchantChoiceRow = z.infer<typeof subMerchantChoiceRowSchema>;

/** The session's own Subs (id/code/name/status), no pagination; readable without MANAGE_SUB_MERCHANT. */
export const listSubMerchantChoiceRows = (): Promise<BeResult<SubMerchantChoiceRow[]>> =>
  merchantClient().get({ path: subMerchantPaths.choices, schema: z.array(subMerchantChoiceRowSchema) });

export const getSubMerchant = (id: string): Promise<BeResult<SubMerchantDetail>> =>
  merchantClient().get({ path: subMerchantPaths.detail(id), schema: subMerchantDetailSchema });

export const createSubMerchant = (values: SubMerchantFormValues, merchantId: string): Promise<BeResult<SubMerchantDetail>> =>
  merchantClient().post({ path: subMerchantPaths.create, schema: subMerchantDetailSchema, body: toCreateRequest(values, merchantId) });

export const updateSubMerchant = (id: string, values: SubMerchantFormValues): Promise<BeResult<SubMerchantDetail>> =>
  merchantClient().put({ path: subMerchantPaths.update(id), schema: subMerchantDetailSchema, body: toUpdateRequest(values) });

export const lockSubMerchant = (id: string, reason: string): Promise<BeResult<SubMerchantDetail>> =>
  merchantClient().post({ path: subMerchantPaths.lock(id), schema: subMerchantDetailSchema, body: { reason } });

export const unlockSubMerchant = (id: string, reason: string): Promise<BeResult<SubMerchantDetail>> =>
  merchantClient().post({ path: subMerchantPaths.unlock(id), schema: subMerchantDetailSchema, body: { reason } });
