"use client";

import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { BANK_OPTIONS } from "../constants/bank-options";
import { normalizeAccountName } from "../utils/bank-mapper";
import type { BankAccountFormValues } from "../types";
import { BankAccountSubsField } from "./BankAccountSubsField";

/**
 * Quy tắc tên chủ TK (BE BankAccountHolderPolicy, 10/11): so với tên pháp nhân KYB của Master VÀ với tên ngân hàng trả
 * về. Cờ "dùng TK tên khác" do Admin tích chỉ bỏ phép so pháp nhân; Portal không tự bật được cờ đó nên câu hướng dẫn
 * nêu quy tắc mặc định.
 */
export const ACCOUNT_NAME_HINT = "Tên phải trùng tên pháp nhân đã xác thực KYB và tên chủ tài khoản tại ngân hàng";

type Props = {
  values: BankAccountFormValues;
  issues: Record<string, string>;
  /** Adding an account offers the default checkbox; editing uses the separate "Đặt làm mặc định" action. */
  mode: "create" | "edit";
  onChange: <K extends keyof BankAccountFormValues>(field: K, value: BankAccountFormValues[K]) => void;
};

/** Keeps an account at a bank outside the catalogue selectable so editing does not blank it. */
function bankOptionsFor(bankCode: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [...BANK_OPTIONS];
  const known = options.some((option) => option.value === bankCode);
  return bankCode && !known ? [...options, { value: bankCode, label: bankCode }] : options;
}

export function BankAccountFields({ values, issues, mode, onChange }: Props) {
  return (
    <>
      {/* SRS v2: TK thuộc danh mục Master, gán 0..N Sub; chọn Sub ở cả thêm mới và sửa (thay ô "Áp dụng cho" cũ). */}
      <BankAccountSubsField value={values.assignSubMerchantIds} onChange={(ids) => onChange("assignSubMerchantIds", ids)} />
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
          description={ACCOUNT_NAME_HINT}
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
    </>
  );
}
