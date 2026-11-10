import "server-only";

import { z } from "zod";
import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { subMerchantDetailSchema, subMerchantStatusSchema, subMerchantSummarySchema, type SubMerchantFormValues } from "@/features/sub-merchants/schemas";
import type { SubMerchantDetail, SubMerchantListFilter, SubMerchantListResult } from "@/features/sub-merchants/types";
import { toCreateRequest, toUpdateRequest } from "@/features/sub-merchants/utils/sub-merchant-mapper";
import { subMerchantPaths } from "./sub-merchant.paths";

/**
 * One page of the session's Subs. Every filter (code, name, status, Master, receiving account, created date) goes
 * to the BE, which filters inside the scoped query; the page and total come straight from it. Until 11/11 the BE
 * only paginated and the code/name/status filters were applied here over at most 10 pages x 100 rows, which lost
 * rows past the 1,000th and cost ten calls per search.
 */
export async function listSubMerchants(filter: SubMerchantListFilter): Promise<BeResult<SubMerchantListResult>> {
  const result = await merchantClient().get({
    path: subMerchantPaths.list,
    schema: pageSchema(subMerchantSummarySchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
      merchantId: filter.merchantId,
      code: filter.code,
      name: filter.name,
      status: filter.status,
      hasBankAccount: filter.hasBankAccount,
      createdFrom: filter.createdFrom,
      createdTo: filter.createdTo,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

const subMerchantChoiceRowSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  status: subMerchantStatusSchema,
  /** Owning Master; lets a multi-Master picker narrow to the chosen Master. Older BEs omit it. */
  merchantId: z.uuid().nullish(),
  /** The Master's default Sub, preselected by the order form. Older BEs omit it. */
  isDefault: z.boolean().optional().default(false),
});
export type SubMerchantChoiceRow = z.infer<typeof subMerchantChoiceRowSchema>;

/** The session's own Subs (id/code/name/status/merchantId/isDefault), no pagination; readable without MANAGE_SUB_MERCHANT. */
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
