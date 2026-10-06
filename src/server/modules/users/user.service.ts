import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { merchantUserSchema, scopeProposalSchema, type MerchantUser, type ScopeProposal, type UserFormValues } from "@/features/users/schemas/user.schema";
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

export function createUser(values: UserFormValues, merchantId: string): Promise<BeResult<MerchantUser>> {
  return merchantClient().post({ path: userPaths.create, schema: merchantUserSchema, body: toCreateUserRequest(values, merchantId) });
}

export function updateUser(id: string, values: { fullName: string; phone?: string }): Promise<BeResult<MerchantUser>> {
  return merchantClient().put({ path: userPaths.detail(id), schema: merchantUserSchema, body: toUpdateUserRequest(values) });
}

export function lockUser(id: string, reason: string): Promise<BeResult<MerchantUser>> {
  return merchantClient().post({ path: userPaths.lock(id), schema: merchantUserSchema, body: { reason } });
}

export function unlockUser(id: string): Promise<BeResult<MerchantUser>> {
  return merchantClient().post({ path: userPaths.unlock(id), schema: merchantUserSchema });
}

export async function resetUserPassword(
  id: string,
  otp: { otpSessionId: string; otp: string },
): Promise<BeResult<{ success: true }>> {
  const result = await merchantClient().post({
    path: userPaths.resetPassword(id),
    schema: merchantUserSchema,
    body: { otp },
  });
  return result.success ? ok({ success: true }) : result;
}

export function assignUserGroups(id: string, groupIds: string[]): Promise<BeResult<MerchantUser>> {
  return merchantClient().post({ path: userPaths.assignGroups(id), schema: merchantUserSchema, body: { ids: groupIds } });
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
