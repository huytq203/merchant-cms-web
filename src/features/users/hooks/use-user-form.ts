import { useState } from "react";
import { userFormSchema, type AssignableGroup, type MerchantUser, type UserFormValues } from "../schemas/user.schema";
import { MIXED_LEVEL_MESSAGE, selectedScopeLevel, type SelectedScopeLevel } from "../utils/group-scope-level";

export type ScopeMode = "all" | "selected";

export type UserFormState = {
  email: string;
  fullName: string;
  phone: string;
  groupIds: string[];
  /** The merchant the new user is created under; its sub-merchants are the only ones that can be picked. */
  merchantId: string;
  scope: ScopeMode;
  subMerchantIds: string[];
};

export type UserForm = ReturnType<typeof useUserForm>;

export const SUB_MERCHANT_REQUIRED_MESSAGE = "Chọn ít nhất một sub-merchant";

function initialValues(user: MerchantUser | null | undefined, merchantId: string): UserFormState {
  return {
    email: user?.email ?? "",
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    groupIds: user?.groups ?? [],
    merchantId,
    scope: "all",
    subMerchantIds: [],
  };
}

/**
 * Khi tạo người dùng, cấp của nhóm đã chọn quyết định phạm vi: Master = toàn Merchant, Sub = phải chọn
 * sub-merchant. Chưa biết cấp (BE cũ, hoặc đang sửa người dùng) thì theo lựa chọn trên form.
 */
function effectiveScope(values: UserFormState, level: SelectedScopeLevel, isCreate: boolean): ScopeMode {
  if (isCreate && level === "MASTER") return "all";
  if (isCreate && level === "SUB") return "selected";
  return values.scope;
}

function validate(values: UserFormState, level: SelectedScopeLevel, isCreate: boolean) {
  const scope = effectiveScope(values, level, isCreate);
  const subMerchantIds = scope === "all" ? [] : values.subMerchantIds;
  const parsed = userFormSchema.safeParse({
    email: values.email.trim(),
    fullName: values.fullName,
    phone: values.phone.trim(),
    groupIds: values.groupIds,
    // Empty for a Sub-only manager (no Master of its own): never send [""].
    merchantIds: values.merchantId ? [values.merchantId] : [],
    subMerchantIds,
  });
  const issues: Record<string, string> = parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  if (isCreate && scope === "selected" && subMerchantIds.length === 0) issues.subMerchantIds = SUB_MERCHANT_REQUIRED_MESSAGE;
  if (level === "MIXED") issues.groupIds = MIXED_LEVEL_MESSAGE;
  return { data: parsed.success ? parsed.data : undefined, issues };
}

export function useUserForm(
  user: MerchantUser | null | undefined,
  merchantId: string,
  onSubmit: (values: UserFormValues) => void,
  /** Nhóm được phép gán, để đọc cấp quản lý của các nhóm đang chọn. */
  groups: readonly AssignableGroup[] = [],
) {
  const [values, setValues] = useState<UserFormState>(() => initialValues(user, merchantId));
  const [issues, setIssues] = useState<Record<string, string>>({});

  const setField = <K extends "email" | "fullName" | "phone">(field: K, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  /** Sub-merchants belong to one merchant, so changing it clears the ones already ticked. */
  const setMerchantId = (next: string) => {
    setValues((current) => (current.merchantId === next ? current : { ...current, merchantId: next, subMerchantIds: [] }));
  };
  const setScope = (scope: ScopeMode) => setValues((current) => ({ ...current, scope }));
  const toggle = (field: "groupIds" | "subMerchantIds", id: string, checked: boolean) => {
    setValues((current) => ({
      ...current,
      [field]: checked ? [...current[field], id] : current[field].filter((value) => value !== id),
    }));
  };
  const scopeLevel = selectedScopeLevel(values.groupIds, groups);
  const submit = () => {
    const result = validate(values, scopeLevel, !user);
    setIssues(result.issues);
    if (result.data && Object.keys(result.issues).length === 0) onSubmit(result.data);
  };

  return { values, issues, scopeLevel, setField, setScope, setMerchantId, toggle, submit };
}
