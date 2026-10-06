import { useState, type FormEvent } from "react";
import { userFormSchema, type MerchantUser, type UserFormValues } from "../schemas/user.schema";

export type UserFormState = {
  email: string;
  fullName: string;
  phone: string;
  groupIds: string[];
  merchantIds: string[];
  subMerchantIds: string[];
};

export type UserForm = ReturnType<typeof useUserForm>;

function initialValues(user: MerchantUser | null | undefined, merchantId: string): UserFormState {
  return {
    email: user?.email ?? "",
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    groupIds: user?.groupIds ?? [],
    merchantIds: user?.merchantIds ?? [merchantId],
    subMerchantIds: user?.subMerchantIds ?? [],
  };
}

export function useUserForm(
  user: MerchantUser | null | undefined,
  merchantId: string,
  onSubmit: (values: UserFormValues) => void,
) {
  const [values, setValues] = useState<UserFormState>(() => initialValues(user, merchantId));
  const [issues, setIssues] = useState<Record<string, string>>({});

  const setField = <K extends "email" | "fullName" | "phone">(field: K, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const toggle = (field: "groupIds" | "subMerchantIds", id: string, checked: boolean) => {
    setValues((current) => ({
      ...current,
      [field]: checked ? [...current[field], id] : current[field].filter((value) => value !== id),
    }));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = userFormSchema.safeParse(values);
    if (!parsed.success) {
      setIssues(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setIssues({});
    onSubmit(parsed.data);
  };

  return { values, issues, setField, toggle, submit };
}
