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

export function toCreateUserRequest(values: UserFormValues, merchantId: string): MerchantUserCreateRequest {
  return {
    email: values.email,
    fullName: values.fullName,
    phone: values.phone || undefined,
    groupIds: values.groupIds,
    merchantIds: values.merchantIds?.length ? values.merchantIds : [merchantId],
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

export function merchantLabel(merchantIds: readonly string[], id: string): string {
  if (merchantIds.length <= 1) return singleMerchantLabel;
  return `Merchant ${merchantIds.indexOf(id) + 1}`;
}

/** Resolves group ids to names; ids the catalog does not know are skipped so no raw id is shown. */
export function groupNames(groupIds: readonly string[], groups: readonly { id: string; name: string }[]): string[] {
  const nameById = new Map(groups.map((group) => [group.id, group.name]));
  return groupIds.flatMap((id) => nameById.get(id) ?? []);
}
