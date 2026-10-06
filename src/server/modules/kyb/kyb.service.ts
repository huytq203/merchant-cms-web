import "server-only";

import { z } from "zod";
import { merchantClient } from "@/lib/be/services";
import { pageSchema, envelopeSchema } from "@/lib/be/envelope";
import { classifyFetchError, invalidResponseError, toBeError } from "@/lib/be/errors";
import { readAccessToken } from "@/lib/auth/session-cookies";
import { getServerEnv } from "@/lib/env/server";
import { fail, ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import {
  documentUploadSchema,
  enterpriseWalletSchema,
  walletAvailabilitySchema,
  walletDocumentSchema,
} from "@/features/kyb/schemas/enterprise-wallet.schema";
import {
  merchantProfileSchema,
  merchantRejectionReasonSchema,
  merchantStatusHistorySchema,
} from "@/features/kyb/schemas/merchant-profile.schema";
import type {
  MerchantFormValues,
  MerchantStagingIds,
  WalletDraftValues,
} from "@/features/kyb/types";
import { toWalletRequest } from "@/features/kyb/utils/kyb-mapper";
import { toMerchantUpdate } from "@/features/kyb/utils/merchant-mapper";
import { kybPaths } from "./kyb.paths";

export function checkAvailability({ email, taxCode }: { email: string; taxCode: string }) {
  return merchantClient().get({
    path: kybPaths.availability,
    query: { registeredEmail: email, taxCode },
    schema: walletAvailabilitySchema,
  });
}

export function saveWalletDraft(values: WalletDraftValues) {
  return merchantClient().post({
    path: kybPaths.walletDrafts,
    schema: enterpriseWalletSchema,
    body: toWalletRequest(values, values),
  });
}

export function createWallet(values: WalletDraftValues) {
  return merchantClient().post({
    path: kybPaths.wallets,
    schema: enterpriseWalletSchema,
    body: toWalletRequest(values, values),
  });
}

export function updateWallet(id: string, values: WalletDraftValues) {
  const { registeredEmail: _email, ...body } = toWalletRequest(values, values);
  void _email;
  return merchantClient().put({
    path: kybPaths.wallet(id),
    schema: enterpriseWalletSchema,
    body,
  });
}

export function submitWallet(id: string) {
  return merchantClient().post({
    path: kybPaths.walletSubmit(id),
    schema: enterpriseWalletSchema,
  });
}

export function getWallet(id: string) {
  return merchantClient().get({
    path: kybPaths.wallet(id),
    schema: enterpriseWalletSchema,
  });
}

export function listWalletDocuments(id: string) {
  return merchantClient().get({
    path: kybPaths.walletDocuments(id),
    schema: z.array(walletDocumentSchema),
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

export function registerMerchant(
  enterpriseWalletId: string,
  values: MerchantFormValues,
  stagingIds: MerchantStagingIds,
) {
  return merchantClient().post({
    path: kybPaths.merchants,
    schema: merchantProfileSchema,
    body: { enterpriseWalletId, ...toMerchantUpdate(values, stagingIds) },
  });
}

export function updateMerchant(
  id: string,
  values: MerchantFormValues,
  stagingIds: MerchantStagingIds,
) {
  return merchantClient().put({
    path: kybPaths.merchant(id),
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
    path: kybPaths.merchant(id),
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

export function listRejectionReasons() {
  return merchantClient().get({
    path: kybPaths.merchantRejectionReasons,
    schema: z.array(merchantRejectionReasonSchema),
  });
}
