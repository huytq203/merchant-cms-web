import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { subMerchantDetailSchema, subMerchantSummarySchema, type SubMerchantFormValues } from "@/features/sub-merchants/schemas";
import type { SubMerchantDetail, SubMerchantListFilter, SubMerchantListResult } from "@/features/sub-merchants/types";
import { toCreateRequest, toUpdateRequest } from "@/features/sub-merchants/utils/sub-merchant-mapper";
import { subMerchantPaths } from "./sub-merchant.paths";

export async function listSubMerchants(filter: SubMerchantListFilter): Promise<BeResult<SubMerchantListResult>> {
  const result = await merchantClient().get({
    path: subMerchantPaths.list,
    schema: pageSchema(subMerchantSummarySchema),
    // The merchant endpoint scopes by session and only paginates; keyword/status are not supported by BE yet.
    query: { page: filter.page, size: filter.pageSize },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

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
