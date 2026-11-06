import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { sensitiveOtpChallengeSchema } from "@/lib/schemas/sensitive-otp";
import { WITHDRAWAL_STATUS_GROUPS } from "@/features/withdrawals/constants/Withdrawal.constants";
import {
  withdrawalBalanceSchema,
  withdrawalResponseSchema,
  type Withdrawal,
  type WithdrawalBalance,
  type WithdrawalCreateBody,
  type WithdrawalOtpChallengeBody,
} from "@/features/withdrawals/schemas/withdrawal.schema";
import type { WithdrawalListFilter, WithdrawalListResult } from "@/features/withdrawals/types/types";
import { toWithdrawalCreateRequest } from "@/features/withdrawals/utils/withdrawal-mapper";
import { withdrawalPaths } from "./withdrawal.paths";

/** The stage a merchant picks stands for several BE statuses, sent as one comma separated list. */
const statusesOf = (filter: WithdrawalListFilter): string | undefined =>
  WITHDRAWAL_STATUS_GROUPS.find((group) => group.value === filter.statusGroup)?.statuses.join(",");

// BE scopes the list by the session, so rows and total are used as returned.
export async function listWithdrawals(filter: WithdrawalListFilter): Promise<BeResult<WithdrawalListResult>> {
  const result = await merchantClient().get({
    path: withdrawalPaths.list,
    schema: pageSchema(withdrawalResponseSchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
      transactionCode: filter.transactionCode,
      status: statusesOf(filter),
      createdFrom: filter.createdFrom,
      createdTo: filter.createdTo,
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

/** BE derives the Master from the Sub and answers 404 for a Sub outside the caller's scope. */
export const getWithdrawalBalance = (subMerchantId: string): Promise<BeResult<WithdrawalBalance>> =>
  merchantClient().get({ path: withdrawalPaths.balance, schema: withdrawalBalanceSchema, query: { subMerchantId } });

/** The operation is fixed here; the code is tied to this (account, amount) pair, so the caller names both. */
export const requestWithdrawalOtp = (body: WithdrawalOtpChallengeBody) =>
  merchantClient().post({ path: withdrawalPaths.otpChallenge, schema: sensitiveOtpChallengeSchema, body });
