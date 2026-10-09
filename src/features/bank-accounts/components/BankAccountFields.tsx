"use client";

import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { BANK_OPTIONS } from "../constants/bank-options";
import { normalizeAccountName } from "../utils/bank-mapper";
import type { BankAccountFormValues } from "../types";
import { BankAccountScopeField } from "./BankAccountScopeField";

type Props = {
  values: BankAccountFormValues;
  issues: Record<string, string>;
  /** Adding an account offers the default checkbox; editing may ask for a reason instead. */
  mode: "create" | "edit";
  askReason: boolean;
  onChange: <K extends keyof BankAccountFormValues>(field: K, value: BankAccountFormValues[K]) => void;
};

/** Keeps an account at a bank outside the catalogue selectable so editing does not blank it. */
function bankOptionsFor(bankCode: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [...BANK_OPTIONS];
  const known = options.some((option) => option.value === bankCode);
  return bankCode && !known ? [...options, { value: bankCode, label: bankCode }] : options;
}

export function BankAccountFields({ values, issues, mode, askReason, onChange }: Props) {
  return (
    <>
      {mode === "create" && <BankAccountScopeField values={values} error={issues.subMerchantId || undefined} onChange={onChange} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Ngân hàng"
          placeholder="Chọn ngân hàng"
          clearable={false}
          value={values.bankCode}
          error={issues.bankCode || undefined}
          options={bankOptionsFor(values.bankCode)}
          onChange={(value) => onChange("bankCode", value)}
        />
        <Input
          label="Chi nhánh"
          placeholder="Ví dụ: Chi nhánh Hà Nội"
          value={values.branchName}
          error={issues.branchName || undefined}
          onChange={(event) => onChange("branchName", event.target.value)}
        />
        <Input
          label="Số tài khoản"
          placeholder={mode === "edit" ? "Để nguyên nếu không đổi" : "Nhập 6–20 chữ số"}
          required
          inputMode="numeric"
          autoComplete="off"
          value={values.accountNumber}
          error={issues.accountNumber || undefined}
          onChange={(event) => onChange("accountNumber", event.target.value)}
        />
        <Input
          label="Chủ tài khoản"
          placeholder="Nhập đúng tên chủ tài khoản (không dấu, in hoa)"
          required
          autoComplete="off"
          value={values.accountName}
          error={issues.accountName || undefined}
          onChange={(event) => onChange("accountName", event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing
            ? event.target.value
            : normalizeAccountName(event.target.value))}
          onCompositionEnd={(event) => onChange("accountName", normalizeAccountName(event.currentTarget.value))}
          onBlur={(event) => onChange("accountName", normalizeAccountName(event.currentTarget.value))}
        />
      </div>
      {mode === "create" && (
        <Checkbox
          label="Đặt làm tài khoản mặc định"
          checked={Boolean(values.isDefault)}
          onCheckedChange={(checked) => onChange("isDefault", checked === true)}
        />
      )}
      {mode === "edit" && askReason && (
        <Input
          label="Lý do thay đổi"
          placeholder="Nhập lý do thay đổi (10–500 ký tự)"
          maxLength={500}
          value={values.reason ?? ""}
          error={issues.reason || undefined}
          onChange={(event) => onChange("reason", event.target.value)}
        />
      )}
    </>
  );
}
