import "server-only";

import { z } from "zod";
import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { merchantUserSchema, scopeChangeResultSchema, scopeProposalSchema, type MerchantUser, type ScopeChangeResult, type ScopeProposal, type ScopeProposalFormValues, type UserFormValues } from "@/features/users/schemas/user.schema";
import { toCreateUserRequest, toUpdateUserRequest } from "@/features/users/utils/user-mapper";
import { userPaths } from "./user.paths";

export interface UserFilter {
  merchantId: string;
  page: number;
  pageSize: number;
  query?: string;
}

export async function listUsers(filter: UserFilter): Promise<BeResult<{ rows: MerchantUser[]; total: number }>> {
  const result = await merchantClient().get({
    path: userPaths.list,
    schema: pageSchema(merchantUserSchema),
    query: { merchantId: filter.merchantId, page: filter.page, size: filter.pageSize },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export function getUser(id: string): Promise<BeResult<MerchantUser>> {
  return merchantClient().get({ path: userPaths.detail(id), schema: merchantUserSchema });
}

/** Write endpoints return a slimmer shape than GET (no active/locked/groups/rolesText), so only the id is checked and the full detail is re-read. */
const writtenUserSchema = z.object({ id: z.uuid() });

async function readAfterWrite(result: BeResult<z.infer<typeof writtenUserSchema>>): Promise<BeResult<MerchantUser>> {
  if (!result.success) return result;
  const detail = await getUser(result.data.id);
  return detail.success ? ok(detail.data, result.message) : detail;
}

export async function createUser(values: UserFormValues, merchantId: string): Promise<BeResult<MerchantUser>> {
  return readAfterWrite(await merchantClient().post({ path: userPaths.create, schema: writtenUserSchema, body: toCreateUserRequest(values, merchantId) }));
}

export async function updateUser(id: string, values: { fullName: string; phone?: string }): Promise<BeResult<MerchantUser>> {
  return readAfterWrite(await merchantClient().put({ path: userPaths.detail(id), schema: writtenUserSchema, body: toUpdateUserRequest(values) }));
}

export async function lockUser(id: string, reason: string): Promise<BeResult<MerchantUser>> {
  return readAfterWrite(await merchantClient().post({ path: userPaths.lock(id), schema: writtenUserSchema, body: { reason } }));
}

export async function unlockUser(id: string): Promise<BeResult<MerchantUser>> {
  return readAfterWrite(await merchantClient().post({ path: userPaths.unlock(id), schema: writtenUserSchema }));
}

/** The BE queues the reset itself and takes no body; whatever it returns is dropped so no secret reaches the browser. */
export async function resetUserPassword(id: string): Promise<BeResult<{ success: true }>> {
  const result = await merchantClient().post({ path: userPaths.resetPassword(id), schema: z.unknown() });
  return result.success ? ok({ success: true }) : result;
}

export async function assignUserGroups(id: string, groupIds: string[]): Promise<BeResult<MerchantUser>> {
  return readAfterWrite(await merchantClient().post({ path: userPaths.assignGroups(id), schema: writtenUserSchema, body: { ids: groupIds } }));
}

/** The BE queues the mail and answers with the user; only the id is checked, the page refetches the rest. */
export function resendUserActivation(id: string): Promise<BeResult<{ id: string }>> {
  return merchantClient().post({ path: userPaths.resendActivation(id), schema: z.object({ id: z.uuid() }) });
}

/** Only the id and status are read; the page refetches the proposal itself. A narrowing is applied at once and has no id. */
export async function createScopeProposal(id: string, values: ScopeProposalFormValues): Promise<BeResult<ScopeChangeResult>> {
  return merchantClient().post({
    path: userPaths.createScopeProposal(id),
    schema: scopeChangeResultSchema,
    body: { subMerchantIds: values.subMerchantIds, reason: values.reason },
  });
}

export function getScopeProposal(id: string): Promise<BeResult<ScopeProposal>> {
  return merchantClient().get({ path: userPaths.scopeProposal(id), schema: scopeProposalSchema });
}

export function approveScopeProposal(id: string): Promise<BeResult<ScopeProposal>> {
  return merchantClient().post({ path: userPaths.approveScopeProposal(id), schema: scopeProposalSchema });
}

export function rejectScopeProposal(id: string, reason: string): Promise<BeResult<ScopeProposal>> {
  return merchantClient().post({
    path: userPaths.rejectScopeProposal(id),
    schema: scopeProposalSchema,
    body: { reason },
  });
}
