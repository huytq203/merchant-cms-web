"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { bankAccountFormSchema } from "../schemas/bank-account-form.schema";
import { isBankIdentityChanged } from "../utils/bank-mapper";
import type { BankErrorView } from "../utils/bank-errors";
import type { BankAccount, BankAccountFormValues } from "../types";
import { BankAccountFields } from "./BankAccountFields";
import { BankFailureAlert } from "./BankFailureAlert";

type Props = {
  open: boolean;
  /** The account being edited; null when adding. */
  account: BankAccount | null;
  /** Values typed before the OTP step, restored when the user comes back. */
  draft: BankAccountFormValues | null;
  isSubmitting: boolean;
  failure: BankErrorView | null;
  onSubmit: (values: BankAccountFormValues) => void;
  onClose: () => void;
  onReload?: () => void;
};

const blank: BankAccountFormValues = {
  bankCode: "",
  accountNumber: "",
  accountName: "",
  branchName: "",
  isDefault: false,
  reason: "",
};

function initialValues(account: BankAccount | null, draft: BankAccountFormValues | null): BankAccountFormValues {
  if (draft) return draft;
  if (!account) return blank;
  return {
    bankCode: account.bankCode,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    branchName: account.branchName ?? "",
    reason: "",
  };
}

/** The BE masks the number it returns, so an untouched number is not validated as if it had been typed. */
function issuesByField(values: BankAccountFormValues, account: BankAccount | null): Record<string, string> | null {
  const parsed = bankAccountFormSchema.safeParse(values);
  if (parsed.success) return null;
  const untouchedNumber = account !== null && values.accountNumber === account.accountNumber;
  const issues = parsed.error.issues.filter((issue) => !(untouchedNumber && issue.path[0] === "accountNumber"));
  return issues.length ? Object.fromEntries(issues.map((issue) => [String(issue.path[0]), issue.message])) : null;
}

const otpNotice = "Bạn sẽ nhận mã OTP qua email để xác nhận trước khi lưu. Thay đổi số tài khoản, ngân hàng hoặc chủ tài khoản sẽ đưa tài khoản về Chờ xác minh. Với tài khoản Sub-merchant, thay đổi cần Flexpay phê duyệt.";
const branchOnlyNotice = "Chỉ thay đổi chi nhánh nên không cần xác thực OTP.";

export function BankAccountFormModal(props: Props) {
  const { open, account, draft, isSubmitting, failure, onSubmit, onClose, onReload } = props;
  const [values, setValues] = useState<BankAccountFormValues>(() => initialValues(account, draft));
  const [issues, setIssues] = useState<Record<string, string>>({});
  // Lỗi tên chủ TK do BE trả (5803/5804/5729) hiện ở ô Chủ tài khoản tới khi người dùng sửa ngân hàng, số TK hoặc tên.
  const [dismissedFailure, setDismissedFailure] = useState<BankErrorView | null>(null);
  const holderFailure = failure?.kind === "holderName" && failure !== dismissedFailure ? failure.message : "";
  const needsOtp = !account || isBankIdentityChanged(account, values);

  const change = <K extends keyof BankAccountFormValues>(field: K, value: BankAccountFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setIssues((current) => ({ ...current, [field]: "" }));
    // Chỉ khi giá trị thật sự đổi: ô tên tự chuẩn hóa lúc rời ô (onBlur) không được xóa lỗi người dùng chưa sửa.
    const identityField = field === "accountName" || field === "accountNumber" || field === "bankCode";
    if (identityField && values[field] !== value) setDismissedFailure(failure);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = issuesByField(values, account);
    setIssues(found ?? {});
    if (!found) onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{account ? "Cập nhật tài khoản ngân hàng" : "Thêm tài khoản ngân hàng"}</DialogTitle>
          <DialogDescription>
            Tài khoản dùng để nhận quyết toán và rút tiền. Chủ tài khoản phải trùng với pháp nhân đã xác thực KYB.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="mt-4 space-y-4">
          <BankAccountFields
            values={values}
            issues={holderFailure && !issues.accountName ? { ...issues, accountName: holderFailure } : issues}
            mode={account ? "edit" : "create"}
            askReason={needsOtp}
            onChange={change}
          />
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            {needsOtp ? otpNotice : branchOnlyNotice}
          </p>
          <BankFailureAlert failure={failure?.kind === "holderName" ? null : failure} onReload={onReload} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="solid" isLoading={isSubmitting}>
              {account ? "Lưu thay đổi" : "Gửi liên kết và xác minh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
