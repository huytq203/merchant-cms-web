import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import {
  withdrawalResponseSchema,
  type Withdrawal,
  type WithdrawalCreateBody,
} from "@/features/withdrawals/schemas/withdrawal.schema";
import type { WithdrawalListFilter, WithdrawalListResult } from "@/features/withdrawals/types/types";
import { toWithdrawalCreateRequest } from "@/features/withdrawals/utils/withdrawal-mapper";
import { withdrawalPaths } from "./withdrawal.paths";

// BE scopes the list by the session, so rows and total are used as returned.
export async function listWithdrawals(filter: WithdrawalListFilter): Promise<BeResult<WithdrawalListResult>> {
  const result = await merchantClient().get({
    path: withdrawalPaths.list,
    schema: pageSchema(withdrawalResponseSchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export const getWithdrawal = (id: string): Promise<BeResult<Withdrawal>> =>
  merchantClient().get({ path: withdrawalPaths.detail(id), schema: withdrawalResponseSchema });

export const createWithdrawal = (body: WithdrawalCreateBody): Promise<BeResult<Withdrawal>> =>
  merchantClient().post({
    path: withdrawalPaths.create,
    schema: withdrawalResponseSchema,
    body: toWithdrawalCreateRequest(body),
  });
