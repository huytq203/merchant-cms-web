import { useState } from "react";
import { userFormSchema, type MerchantUser, type UserFormValues } from "../schemas/user.schema";

export type ScopeMode = "all" | "selected";

export type UserFormState = {
  email: string;
  fullName: string;
  phone: string;
  groupIds: string[];
  scope: ScopeMode;
  subMerchantIds: string[];
};

export type UserForm = ReturnType<typeof useUserForm>;

export const SUB_MERCHANT_REQUIRED_MESSAGE = "Chọn ít nhất một sub-merchant";

function initialValues(user: MerchantUser | null | undefined): UserFormState {
  return {
    email: user?.email ?? "",
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    groupIds: user?.groups ?? [],
    scope: "all",
    subMerchantIds: [],
  };
}

function validate(values: UserFormState, merchantId: string) {
  const subMerchantIds = values.scope === "all" ? [] : values.subMerchantIds;
  const parsed = userFormSchema.safeParse({
    email: values.email.trim(),
    fullName: values.fullName,
    phone: values.phone.trim(),
    groupIds: values.groupIds,
    merchantIds: [merchantId],
    subMerchantIds,
  });
  const issues: Record<string, string> = parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
  if (values.scope === "selected" && subMerchantIds.length === 0) issues.subMerchantIds = SUB_MERCHANT_REQUIRED_MESSAGE;
  return { data: parsed.success ? parsed.data : undefined, issues };
}

export function useUserForm(
  user: MerchantUser | null | undefined,
  merchantId: string,
  onSubmit: (values: UserFormValues) => void,
) {
  const [values, setValues] = useState<UserFormState>(() => initialValues(user));
  const [issues, setIssues] = useState<Record<string, string>>({});

  const setField = <K extends "email" | "fullName" | "phone">(field: K, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const setScope = (scope: ScopeMode) => setValues((current) => ({ ...current, scope }));
  const toggle = (field: "groupIds" | "subMerchantIds", id: string, checked: boolean) => {
    setValues((current) => ({
      ...current,
      [field]: checked ? [...current[field], id] : current[field].filter((value) => value !== id),
    }));
  };
  const submit = () => {
    const result = validate(values, merchantId);
    setIssues(result.issues);
    if (result.data && Object.keys(result.issues).length === 0) onSubmit(result.data);
  };

  return { values, issues, setField, setScope, toggle, submit };
}
