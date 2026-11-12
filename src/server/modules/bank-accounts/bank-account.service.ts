import "server-only";

import { emptySchema, pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import {
  bankAccountSchema,
  bankCreateResponseSchema,
  bankUpdateResponseSchema,
  sensitiveOtpChallengeSchema,
} from "@/features/bank-accounts/schemas/bank-account.schema";
import type {
  BankAccount,
  BankAccountFilter,
  BankAccountList,
  BankOtpChallenge,
  BankUpdateResponse,
  CreateBankRequest,
  UpdateBankRequest,
} from "@/features/bank-accounts/types";
import { formatSubMerchantIds } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { bankAccountPaths } from "./bank-account.paths";

/** Only the operation the merchant portal may ask for; the approval operation belongs to the checker. */
export type MerchantSensitiveOperation = "BANK_ACCOUNT_CHANGE";

export async function listBankAccounts(filter: BankAccountFilter): Promise<BeResult<BankAccountList>> {
  const result = await merchantClient().get({
    path: bankAccountPaths.list,
    schema: pageSchema(bankAccountSchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
      subMerchantIds: formatSubMerchantIds(filter.subMerchantIds),
      linkStatus: filter.linkStatus,
      status: filter.status,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export const getBankAccount = (id: string): Promise<BeResult<BankAccount>> =>
  merchantClient().get({ path: bankAccountPaths.detail(id), schema: bankAccountSchema });

export const createBankAccount = (body: CreateBankRequest): Promise<BeResult<BankUpdateResponse>> =>
  merchantClient().post({ path: bankAccountPaths.create, schema: bankCreateResponseSchema, body });

export const updateBankAccount = (id: string, body: UpdateBankRequest): Promise<BeResult<BankUpdateResponse>> =>
  merchantClient().put({ path: bankAccountPaths.update(id), schema: bankUpdateResponseSchema, body });

export const deleteBankAccount = (id: string, reason?: string): Promise<BeResult<undefined>> =>
  merchantClient().delete({
    path: bankAccountPaths.remove(id),
    schema: emptySchema,
    body: reason ? { reason } : undefined,
  });

export const setDefaultBankAccount = (id: string, reason?: string): Promise<BeResult<BankUpdateResponse>> =>
  merchantClient().put({
    path: bankAccountPaths.setDefault(id),
    schema: bankUpdateResponseSchema,
    body: reason ? { reason } : undefined,
  });

export const requestSensitiveOtp = (
  operation: MerchantSensitiveOperation,
  targetId?: string,
): Promise<BeResult<BankOtpChallenge>> =>
  merchantClient().post({
    path: bankAccountPaths.otpChallenge,
    schema: sensitiveOtpChallengeSchema,
    body: targetId ? { operation, targetId } : { operation },
  });
