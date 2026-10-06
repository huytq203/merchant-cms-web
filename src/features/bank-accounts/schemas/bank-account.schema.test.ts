import { describe, expect, it } from "vitest";
import { bankAccountSchema } from "./bank-account.schema";
import { bankAccountFormSchema } from "./bank-account-form.schema";
import { bankStatusLabel, canChangeBank, isBankIdentityChanged, toCreateBankRequest, toUpdateBankRequest } from "../utils/bank-mapper";

const account = {
  id: "11111111-1111-4111-8111-111111111111",
  merchantId: "22222222-2222-4222-8222-222222222222",
  version: 1,
  bankCode: "VCB",
  accountNumber: "1234567890",
  accountName: "NGUYEN VAN A",
  status: "ACTIVE",
  linkStatus: "LINKED",
  isDefault: true,
};

describe("bank account contract", () => {
  it.each(["PENDING_VERIFICATION", "LINKED", "LINK_FAILED"])("parses %s and normalizes default", (linkStatus) => {
    expect(bankAccountSchema.parse({ ...account, linkStatus })).toMatchObject({ isDefault: true, linkStatus });
  });
  it("rejects invalid account numbers", () => {
    const form = { bankCode: "VCB", accountName: "A", branchName: "" };
    expect(bankAccountFormSchema.safeParse({ ...form, accountNumber: "abc123" }).success).toBe(false);
    expect(bankAccountFormSchema.safeParse({ ...form, accountNumber: "12345" }).success).toBe(false);
    expect(bankAccountFormSchema.safeParse({ ...form, accountNumber: "123456" }).success).toBe(true);
  });
  it("accepts the portal DTO, keeps the BE masked number and exposes the owning Master", () => {
    const parsed = bankAccountSchema.parse({
      ...account,
      accountNumber: "******7890",
      level: "TERMINAL",
      subMerchantId: "33333333-3333-4333-8333-333333333333",
      payable: true,
      createdAt: "2026-10-05T12:00:00",
      updatedAt: "2026-10-05T12:00:00",
    });
    expect(parsed.accountNumber).toBe("******7890");
    expect(parsed.merchantId).toBe(account.merchantId);
    expect(parsed).not.toHaveProperty("owningMerchantId");
  });
  it("reads the default flag from either isDefault or default and drops fields the BE no longer sends", () => {
    expect(bankAccountSchema.parse({ ...account, isDefault: undefined, default: true }).isDefault).toBe(true);
    expect(bankAccountSchema.parse({ ...account, holdMode: true, linkFailureReason: "x" })).not.toHaveProperty("holdMode");
  });
  it("blocks pending changes", () => {
    const parsed = bankAccountSchema.parse(account);
    expect(canChangeBank(parsed, { status: "PENDING" })).toBe(false);
    expect(canChangeBank(parsed)).toBe(true);
  });
  it("omits absent OTP", () => {
    const request = toCreateBankRequest({ bankCode: "VCB", accountNumber: "123456", accountName: "A", branchName: "" }, null, null);
    expect(request).not.toHaveProperty("otp");
  });
  it("keeps a failed link editable but not a stopped account", () => {
    expect(canChangeBank(bankAccountSchema.parse({ ...account, linkStatus: "LINK_FAILED" }))).toBe(true);
    expect(canChangeBank(bankAccountSchema.parse({ ...account, status: "INACTIVE" }))).toBe(false);
  });
  it("detects a bank, number or holder change but not a branch change", () => {
    const parsed = bankAccountSchema.parse(account);
    const same = { bankCode: "VCB", accountNumber: "1234567890", accountName: "NGUYEN VAN A" };
    expect(isBankIdentityChanged(parsed, same)).toBe(false);
    expect(isBankIdentityChanged(parsed, { ...same, accountNumber: "1234567891" })).toBe(true);
    expect(isBankIdentityChanged(parsed, { ...same, bankCode: "TCB" })).toBe(true);
    expect(isBankIdentityChanged(parsed, { ...same, accountName: "NGUYEN VAN B" })).toBe(true);
  });
  it("always carries the version on update and labels the usage status in Vietnamese", () => {
    const form = { bankCode: "VCB", accountNumber: "123456", accountName: "A", branchName: "" };
    expect(toUpdateBankRequest(form, 7, "session", "123456")).toMatchObject({ version: 7, otp: { otpSessionId: "session", otp: "123456" } });
    expect(toUpdateBankRequest(form, 7, null, null)).not.toHaveProperty("otp");
    expect(bankStatusLabel("INACTIVE")).not.toMatch(/INACTIVE/);
  });
});
