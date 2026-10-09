import "server-only";

import { z } from "zod";
import { merchantClient } from "@/lib/be/services";
import { pageSchema, envelopeSchema } from "@/lib/be/envelope";
import { classifyFetchError, invalidResponseError, toBeError } from "@/lib/be/errors";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";
import { fail, ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { documentUploadSchema, enterpriseWalletSchema } from "@/features/kyb/schemas/enterprise-wallet.schema";
import { merchantProfileSchema, merchantStatusHistorySchema } from "@/features/kyb/schemas/merchant-profile.schema";
import { sensitiveOtpChallengeSchema, type SensitiveOtp } from "@/lib/schemas/sensitive-otp";
import type {
  MerchantFormValues,
  MerchantStagingIds,
  WalletDraftValues,
} from "@/features/kyb/types";
import { toWalletRequest } from "@/features/kyb/utils/kyb-mapper";
import { toMerchantUpdate } from "@/features/kyb/utils/merchant-mapper";
import { kybPaths } from "./kyb.paths";

export function updateWallet(id: string, values: WalletDraftValues, otp?: SensitiveOtp) {
  const { registeredEmail: _email, ...body } = toWalletRequest(values, values);
  void _email;
  return merchantClient().put({
    path: kybPaths.walletUpdate(id),
    schema: enterpriseWalletSchema,
    body: otp ? { ...body, otp } : body,
  });
}

export function submitWallet(id: string, otp: SensitiveOtp) {
  return merchantClient().post({
    path: kybPaths.walletSubmit(id),
    schema: enterpriseWalletSchema,
    body: { otp },
  });
}

/** Names of the other wallets that already use this tax code; never the caller's own. */
export function getTaxCodeUsage(walletId: string, taxCode: string) {
  return merchantClient().get({
    path: kybPaths.walletTaxCodeUsage(walletId),
    query: { taxCode },
    schema: z.array(z.string()),
  });
}

export function requestKybOtp() {
  return merchantClient().post({
    path: kybPaths.otpChallenge,
    schema: sensitiveOtpChallengeSchema,
    body: { operation: "KYB_SUBMIT" },
  });
}

export async function uploadDocument(file: File, documentType: string): Promise<BeResult<z.infer<typeof documentUploadSchema>>> {
  const body = new FormData();
  body.set("documentType", documentType);
  body.set("file", file);
  let response: Response;
  try {
    const token = await readAccessToken();
    response = await fetch(`${getServerEnv().MERCHANT_BASE_URL}${kybPaths.documents}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    const failure = classifyFetchError(error);
    return fail(failure, failure.code);
  }
  const raw: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const failure = toBeError(response.status, raw);
    return fail(failure, failure.code);
  }
  const envelope = envelopeSchema.safeParse(raw);
  const parsed = envelope.success && envelope.data.success
    ? documentUploadSchema.safeParse(envelope.data.data)
    : null;
  if (!parsed?.success) {
    const failure = invalidResponseError(response.status);
    return fail(failure, failure.code);
  }
  return ok(parsed.data);
}

export function updateMerchant(
  id: string,
  values: MerchantFormValues,
  stagingIds: MerchantStagingIds,
) {
  return merchantClient().put({
    path: kybPaths.merchantUpdate(id),
    schema: merchantProfileSchema,
    body: toMerchantUpdate(values, stagingIds),
  });
}

export function submitMerchant(id: string) {
  return merchantClient().post({
    path: kybPaths.merchantSubmit(id),
    schema: merchantProfileSchema,
  });
}

export function getMerchant(id: string) {
  return merchantClient().get({
    path: kybPaths.merchantRead(id),
    schema: merchantProfileSchema,
  });
}

export async function getMerchantStatusHistory(id: string, page: number) {
  const result = await merchantClient().get({
    path: kybPaths.merchantStatusHistory(id),
    query: { page, size: 10 },
    schema: pageSchema(merchantStatusHistorySchema),
  });
  return result.success
    ? ok({ rows: result.data.content, total: result.data.totalElements })
    : result;
}

