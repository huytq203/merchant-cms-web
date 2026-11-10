import type { SessionMerchant } from "@/types/auth";
import { singleMerchantLabel } from "../constants/user.constants";
import type { MerchantUser, UserFormValues } from "../schemas/user.schema";
import { userStatusOf } from "./user-view";

export interface MerchantUserCreateRequest {
  email: string;
  fullName: string;
  phone?: string;
  groupIds: string[];
  merchantIds: string[];
  subMerchantIds: string[];
}

export interface MerchantUserUpdateRequest {
  fullName: string;
  phone?: string;
}

/** `merchantId` is absent for a Sub-only manager: the BE derives the Master from the chosen Subs. */
export function toCreateUserRequest(values: UserFormValues, merchantId: string | undefined): MerchantUserCreateRequest {
  return {
    email: values.email,
    fullName: values.fullName,
    phone: values.phone || undefined,
    groupIds: values.groupIds,
    merchantIds: values.merchantIds?.length ? values.merchantIds : merchantId ? [merchantId] : [],
    subMerchantIds: values.subMerchantIds ?? [],
  };
}

export function toUpdateUserRequest(values: { fullName: string; phone?: string }): MerchantUserUpdateRequest {
  return { fullName: values.fullName, phone: values.phone || undefined };
}

export function canLockUser(user: Pick<MerchantUser, "id" | "active" | "locked">, actorId: string): boolean {
  return user.id !== actorId && userStatusOf(user) === "ACTIVE";
}

export function canUnlockUser(user: Pick<MerchantUser, "active" | "locked">): boolean {
  return userStatusOf(user) === "LOCKED";
}

export function hasSameIds(left: readonly string[] = [], right: readonly string[] = []): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

/** Count of the user's merchants, for when their names are not known (a bare "Merchant 3" named nothing). */
export function merchantScopeLabel(userMerchantIds: readonly string[]): string {
  return userMerchantIds.length === 0 ? "Chưa có" : `${userMerchantIds.length} merchant`;
}

/** Labels of all the user's merchants, or null when any has no known name (the caller then shows a count). */
export function merchantScopeNames(
  userMerchantIds: readonly string[],
  merchants: readonly SessionMerchant[],
): string[] | null {
  if (userMerchantIds.length === 0) return null;
  const labels = userMerchantIds.map((id) => {
    const merchant = merchants.find((candidate) => candidate.id === id);
    if (!merchant?.name) return null;
    return merchant.code ? `${merchant.code} · ${merchant.name}` : merchant.name;
  });
  return labels.every((label): label is string => label !== null) ? labels : null;
}

/** A merchant as people know it: "MC000001 · Halo tech"; the position label only when the BE sent no name. */
export function merchantOptionLabel(
  merchants: readonly SessionMerchant[],
  sessionMerchantIds: readonly string[],
  id: string,
): string {
  const merchant = merchants.find((candidate) => candidate.id === id);
  if (!merchant?.name) return merchantLabel(sessionMerchantIds, id);
  return merchant.code ? `${merchant.code} · ${merchant.name}` : merchant.name;
}

export function merchantLabel(merchantIds: readonly string[], id: string): string {
  if (merchantIds.length <= 1) return singleMerchantLabel;
  return `Merchant ${merchantIds.indexOf(id) + 1}`;
}

/** Resolves group ids to names; ids the catalog does not know are skipped so no raw id is shown. */
export function groupNames(groupIds: readonly string[], groups: readonly { id: string; name: string }[]): string[] {
  const nameById = new Map(groups.map((group) => [group.id, group.name]));
  return groupIds.flatMap((id) => nameById.get(id) ?? []);
}
