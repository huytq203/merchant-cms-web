import { describe, expect, it } from "vitest";
import { bankAccountSchema, bankUpdateResponseSchema } from "../bank-account.schema";
import { bankAccountFormSchema } from "../bank-account-form.schema";
import {
  bankAccountStatusLabel,
  isAssignmentChanged,
  isBankIdentityChanged,
  normalizeAccountName,
  toCreateBankRequest,
  toUpdateBankRequest,
} from "../../utils/bank-mapper";

const subA = { id: "33333333-3333-4333-8333-333333333333", code: "SUB01", name: "Cửa hàng A" };
const subB = { id: "44444444-4444-4444-8444-444444444444", code: "SUB02", name: "Cửa hàng B" };
const account = {
  id: "11111111-1111-4111-8111-111111111111",
  merchantId: "22222222-2222-4222-8222-222222222222",
  version: 1,
  bankCode: "VCB",
  accountNumber: "1234567890",
  accountName: "NGUYEN VAN A",
  accountStatus: "VERIFIED",
  payable: true,
  isDefault: true,
  assignedSubMerchants: [subA],
};
const form = { bankCode: "VCB", accountNumber: "123456", accountName: "A", branchName: "", assignSubMerchantIds: [] };

describe("bank account contract (SRS v2)", () => {
  it.each(["PENDING_VERIFICATION", "VERIFIED", "LOCKED"])("parses accountStatus %s", (accountStatus) => {
    expect(bankAccountSchema.parse({ ...account, accountStatus })).toMatchObject({ accountStatus, isDefault: true });
  });

  it("keeps the Subs using the account, and reads a missing list as no Sub", () => {
    expect(bankAccountSchema.parse(account).assignedSubMerchants).toEqual([subA]);
    expect(bankAccountSchema.parse({ ...account, assignedSubMerchants: null }).assignedSubMerchants).toEqual([]);
  });

  it("drops the fields of the old model (level, owning Sub, link/usage status, pending change)", () => {
    const parsed = bankAccountSchema.parse({
      ...account, subMerchantId: subA.id, level: "SUB", status: "ACTIVE", linkStatus: "LINKED", pendingChangeRequest: { id: "x" },
    });
    for (const field of ["subMerchantId", "level", "status", "linkStatus", "pendingChangeRequest"]) {
      expect(parsed).not.toHaveProperty(field);
    }
  });

  it("reads the default flag from either isDefault or default", () => {
    expect(bankAccountSchema.parse({ ...account, isDefault: undefined, default: true }).isDefault).toBe(true);
  });

  it("reads the PUT answer as the saved account (BE v2 always applies right away)", () => {
    const parsed = bankUpdateResponseSchema.parse({ account, applied: true, pendingChangeRequest: null });
    expect(parsed.account.id).toBe(account.id);
  });

  it("rejects invalid account numbers", () => {
    expect(bankAccountFormSchema.safeParse({ ...form, accountNumber: "abc123" }).success).toBe(false);
    expect(bankAccountFormSchema.safeParse({ ...form, accountNumber: "12345" }).success).toBe(false);
    expect(bankAccountFormSchema.safeParse({ ...form, accountNumber: "123456" }).success).toBe(true);
  });

  it("creates with the chosen Subs and without any level/owning Sub", () => {
    const request = toCreateBankRequest({ ...form, assignSubMerchantIds: [subA.id, subB.id] }, null, null);
    expect(request).toMatchObject({ assignSubMerchantIds: [subA.id, subB.id] });
    expect(request).not.toHaveProperty("subMerchantId");
    expect(request).not.toHaveProperty("otp");
  });

  it("does not send back an unchanged identity field or an unchanged Sub list", () => {
    const current = bankAccountSchema.parse({ ...account, accountNumber: "******7890" });
    const request = toUpdateBankRequest(
      { bankCode: "VCB", accountNumber: "******7890", accountName: current.accountName, branchName: "Chi nhánh mới", assignSubMerchantIds: [subA.id] },
      current, null, null,
    );
    expect(request).toEqual({ version: current.version, branchName: "Chi nhánh mới" });
  });

  it("sends the whole Sub list after saving when it changed, [] when every Sub is removed", () => {
    const current = bankAccountSchema.parse(account);
    const values = { bankCode: "VCB", accountNumber: "1234567890", accountName: "NGUYEN VAN A", branchName: "" };
    expect(toUpdateBankRequest({ ...values, assignSubMerchantIds: [subB.id, subA.id] }, current, "s", "123456"))
      .toMatchObject({ assignSubMerchantIds: [subB.id, subA.id], otp: { otpSessionId: "s", otp: "123456" } });
    expect(toUpdateBankRequest({ ...values, assignSubMerchantIds: [] }, current, null, null))
      .toMatchObject({ assignSubMerchantIds: [] });
  });

  it("tells a Sub list change apart from the same Subs in another order", () => {
    const current = bankAccountSchema.parse(account);
    expect(isAssignmentChanged(current, [subA.id])).toBe(false);
    expect(isAssignmentChanged(current, [subA.id, subB.id])).toBe(true);
    expect(isAssignmentChanged(current, [])).toBe(true);
  });

  it("detects a bank, number or holder change but not a branch change", () => {
    const parsed = bankAccountSchema.parse(account);
    const same = { bankCode: "VCB", accountNumber: "1234567890", accountName: "NGUYEN VAN A" };
    expect(isBankIdentityChanged(parsed, same)).toBe(false);
    expect(isBankIdentityChanged(parsed, { ...same, accountNumber: "1234567891" })).toBe(true);
    expect(isBankIdentityChanged(parsed, { ...same, bankCode: "TCB" })).toBe(true);
    expect(isBankIdentityChanged(parsed, { ...same, accountName: "NGUYEN VAN B" })).toBe(true);
  });

  it("labels the account status in Vietnamese", () => {
    expect(bankAccountStatusLabel("PENDING_VERIFICATION")).toBe("Chờ xác minh");
    expect(bankAccountStatusLabel("VERIFIED")).toBe("Đã xác minh");
    expect(bankAccountStatusLabel("LOCKED")).toBe("Khóa");
  });

  it("writes the holder name in capitals without diacritics", () => {
    expect(normalizeAccountName("Trần Quang Huy")).toBe("TRAN QUANG HUY");
    expect(normalizeAccountName("đặng văn Đức")).toBe("DANG VAN DUC");
  });
});
